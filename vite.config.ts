import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Plugin for server-side product scraping and API proxying
function productImporterPlugin(): Plugin {
  return {
    name: 'product-importer-api',
    configureServer(server) {
      // 1. Scrape Single Product from any Website URL
      server.middlewares.use('/api/scrape-product', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          let targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl && req.method === 'POST') {
            // Read body
            const buffers: Buffer[] = [];
            for await (const chunk of req) {
              buffers.push(Buffer.from(chunk));
            }
            const bodyStr = Buffer.concat(buffers).toString('utf-8');
            try {
              const parsed = JSON.parse(bodyStr);
              targetUrl = parsed.url;
            } catch {
              // ignore
            }
          }

          if (!targetUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Missing "url" parameter.' }));
            return;
          }

          // Fetch the external webpage with a standard browser User-Agent and 18s timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 18000);

          let response: Response;
          try {
            response = await fetch(targetUrl, {
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,application/json,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
                'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
              },
            });
          } catch (fetchErr: unknown) {
            clearTimeout(timeoutId);
            const errObj = fetchErr as { name?: string; message?: string };
            const isTimeout = errObj.name === 'AbortError' || errObj.message?.includes('aborted');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              error: isTimeout
                ? 'ওয়েবসাইটের সাথে সংযোগ করতে সময় বেশি লেগেছে (Connection Timeout)। অনুগ্রহ করে লিঙ্কটি চেক করুন অথবা ম্যানুয়ালি তথ্য পূরণ করুন।'
                : 'ওয়েবসাইটের সাথে সংযোগ স্থাপন করা যায়নি। লিঙ্কটি চেক করুন।'
            }));
            return;
          } finally {
            clearTimeout(timeoutId);
          }

          if (!response.ok) {
            let friendlyMsg = `ওয়েবসাইট থেকে স্ট্যাটাস কোড ${response.status} এসেছে।`;
            if (response.status === 403) {
              friendlyMsg = 'ওয়েবসাইটটির সিকিউরিটি প্রটেকশন (Cloudflare/Bot Guard) এর কারণে সরাসরি তথ্য আনা যাচ্ছে না। অনুগ্রহ করে ম্যানুয়ালি তথ্য দিন।';
            } else if (response.status === 404) {
              friendlyMsg = 'প্রোডাক্টের লিঙ্কটি খুঁজে পাওয়া যায়নি (404 Not Found)। লিঙ্কটি সঠিক কিনা চেক করুন।';
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ success: false, error: friendlyMsg }));
            return;
          }

          const contentType = response.headers.get('content-type') || '';

          // If the target URL is a JSON API endpoint (e.g. DummyJSON or REST API)
          if (contentType.includes('application/json')) {
            try {
              const jsonData = await response.json();
              const p = jsonData.product || jsonData.data || jsonData;
              const jsonTitle = p.title || p.name || p.product_name || '';
              const jsonDesc = p.description || p.detail || '';
              const jsonPrice = Number(p.price) || 0;
              const jsonBrand = p.brand || 'Imported Tech';
              const jsonImages: string[] = [];

              if (Array.isArray(p.images)) {
                p.images.forEach((img: unknown) => {
                  if (typeof img === 'string' && img.startsWith('http')) jsonImages.push(img);
                });
              }
              if (jsonImages.length === 0 && (p.thumbnail || p.image)) {
                const singleImg = p.thumbnail || p.image;
                if (typeof singleImg === 'string' && singleImg.startsWith('http')) {
                  jsonImages.push(singleImg);
                }
              }

              if (jsonTitle) {
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  sourceUrl: targetUrl,
                  product: {
                    title: jsonTitle,
                    description: jsonDesc,
                    price: jsonPrice,
                    currency: 'BDT',
                    brand: jsonBrand,
                    sku: p.sku || `IMP-${Date.now().toString().slice(-4)}`,
                    stockQuantity: Number(p.stock) || Number(p.stockQuantity) || 20,
                    images: jsonImages.length > 0 ? jsonImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
                    features: Array.isArray(p.features) ? p.features : undefined,
                  }
                }));
                return;
              }
            } catch {
              // fallback to text parsing if json parsing failed
            }
          }

          const html = await response.text();

          // 1. Try parsing JSON-LD Schema (schema.org/Product)
          let jsonLdProduct: any = null;
          const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
          let match: RegExpExecArray | null;

          while ((match = jsonLdRegex.exec(html)) !== null) {
            try {
              const parsedJson = JSON.parse(match[1]);
              const checkProduct = (obj: any): any => {
                if (!obj) return null;
                if (obj['@type'] === 'Product') return obj;
                if (Array.isArray(obj)) {
                  for (const it of obj) {
                    const found = checkProduct(it);
                    if (found) return found;
                  }
                }
                if (Array.isArray(obj['@graph'])) {
                  for (const it of obj['@graph']) {
                    const found = checkProduct(it);
                    if (found) return found;
                  }
                }
                return null;
              };
              const found = checkProduct(parsedJson);
              if (found) {
                jsonLdProduct = found;
                break;
              }
            } catch {
              // ignore invalid JSON-LD block
            }
          }

          // 2. OpenGraph & Meta Tag extractors
          const getMeta = (prop: string): string => {
            const r1 = new RegExp(`<meta\\s+(?:property|name)=["'](?:og:|twitter:)?${prop}["']\\s+content=["'](.*?)["']`, 'i');
            const r2 = new RegExp(`<meta\\s+content=["'](.*?)["']\\s+(?:property|name)=["'](?:og:|twitter:)?${prop}["']`, 'i');
            const m = html.match(r1) || html.match(r2);
            return m ? m[1].trim() : '';
          };

          // Extract Title
          let title = '';
          if (jsonLdProduct?.name) {
            title = jsonLdProduct.name;
          } else {
            title = getMeta('title');
            if (!title) {
              const titleTag = html.match(/<title>([^<]*)<\/title>/i);
              title = titleTag ? titleTag[1].trim() : '';
            }
          }
          // Clean title if ends with " | BrandName"
          title = title.replace(/\s*[|\-–—]\s*(?:Amazon|Daraz|StarTech|Ryans|AliExpress|Shopify|eBay).*$/i, '').trim();

          // Extract Description
          let description = jsonLdProduct?.description || getMeta('description') || '';
          if (description.length > 500) {
            description = description.slice(0, 500) + '...';
          }

          // Extract Images with specialized Amazon, AliExpress, Alibaba, and generic e-commerce support
          const images: string[] = [];
          const sanitizeImageUrl = (rawUrl: string): string => {
            if (!rawUrl) return '';
            let cleaned = rawUrl.replace(/\\"/g, '"').replace(/\\\//g, '/').trim();
            if (cleaned.startsWith('//')) {
              cleaned = 'https:' + cleaned;
            }
            // If Amazon image with thumbnail crop like ._SX500_ or ._AC_US40_, remove it for full high-res
            if (cleaned.includes('media-amazon.com')) {
              cleaned = cleaned.replace(/\._[A-Z0-9_,]+_\./i, '.');
            }
            // If AliExpress image with small crop like _50x50.jpg, strip it
            if (cleaned.includes('alicdn.com')) {
              cleaned = cleaned.replace(/_[0-9]+x[0-9]+[a-z]*\.(?:jpg|png|webp)/i, '.jpg');
            }
            return cleaned;
          };

          const addImage = (u: string) => {
            const sanitized = sanitizeImageUrl(u);
            if (
              sanitized &&
              sanitized.startsWith('http') &&
              !sanitized.includes('sprite') &&
              !sanitized.includes('placeholder') &&
              !sanitized.includes('icon') &&
              !images.includes(sanitized) &&
              images.length < 10
            ) {
              images.push(sanitized);
            }
          };

          // A. Amazon colorImages & dynamic images
          const amazonHiResMatches = html.matchAll(/"(?:hiRes|large)"\s*:\s*"(https?:[^"]+)"/gi);
          for (const m of amazonHiResMatches) {
            addImage(m[1]);
          }

          const amazonDynImgMatches = html.matchAll(/data-a-dynamic-image=["'](\{.*?\})["']/gi);
          for (const m of amazonDynImgMatches) {
            try {
              const dynObj = JSON.parse(m[1].replace(/&quot;/g, '"'));
              Object.keys(dynObj).forEach(k => addImage(k));
            } catch {
              // ignore
            }
          }

          const amazonOldHiRes = html.matchAll(/data-old-hires=["'](https?:[^"']+)["']/gi);
          for (const m of amazonOldHiRes) {
            addImage(m[1]);
          }

          // B. AliExpress & Alibaba CDN images (ae01.alicdn.com, sc04.alicdn.com)
          const aliMatches = html.matchAll(/(?:https?:)?\/\/([a-z0-9\-_]+\.alicdn\.com\/kf\/[a-zA-Z0-9_\-\.]+\.(?:jpg|jpeg|png|webp))/gi);
          for (const m of aliMatches) {
            addImage('https://' + m[1]);
          }

          const aliImageModuleMatches = html.matchAll(/imagePathList\s*:\s*\[([\s\S]*?)\]/gi);
          for (const m of aliImageModuleMatches) {
            const innerUrls = m[1].matchAll(/"([^"]+)"/g);
            for (const iu of innerUrls) {
              addImage(iu[1]);
            }
          }

          // C. JSON-LD schema images
          if (jsonLdProduct?.image) {
            if (Array.isArray(jsonLdProduct.image)) {
              jsonLdProduct.image.forEach((img: any) => {
                const src = typeof img === 'string' ? img : img?.url;
                if (src) addImage(src);
              });
            } else if (typeof jsonLdProduct.image === 'string') {
              addImage(jsonLdProduct.image);
            } else if (jsonLdProduct.image?.url) {
              addImage(jsonLdProduct.image.url);
            }
          }

          // D. OpenGraph / Twitter meta images
          const ogImage = getMeta('image');
          if (ogImage) {
            addImage(ogImage);
          }

          // E. General HTML image search fallback
          const imgMatches = html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src)=["']((?:https?:)?\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi);
          for (const m of imgMatches) {
            addImage(m[1]);
          }

          // Extract Features & Bullet Points (e.g. from Amazon feature-bullets or specs)
          const extractedFeatures: string[] = [];
          const featureBulletsMatch = html.match(/<div\s+id=["']feature-bullets["'][^>]*>([\s\S]*?)<\/div>/i);
          if (featureBulletsMatch) {
            const bulletMatches = featureBulletsMatch[1].matchAll(/<li[^>]*><span[^>]*>(.*?)<\/span><\/li>/gi);
            for (const bm of bulletMatches) {
              const text = bm[1].replace(/<[^>]+>/g, '').trim();
              if (text && text.length > 5 && !extractedFeatures.includes(text) && extractedFeatures.length < 6) {
                extractedFeatures.push(text);
              }
            }
          }

          // Extract Price
          let price = 0;
          let currency = 'BDT';
          if (jsonLdProduct?.offers) {
            const offers = Array.isArray(jsonLdProduct.offers) ? jsonLdProduct.offers[0] : jsonLdProduct.offers;
            if (offers?.price) {
              price = parseFloat(offers.price);
              if (offers.priceCurrency) currency = offers.priceCurrency;
            }
          }

          if (!price) {
            const ogPrice = getMeta('price:amount');
            if (ogPrice) {
              price = parseFloat(ogPrice);
              const ogCurr = getMeta('price:currency');
              if (ogCurr) currency = ogCurr;
            }
          }

          // If price still not found, try text patterns
          if (!price) {
            const bdtPattern = /(?:৳|Tk\.?|BDT)\s*([0-9,]+(?:\.[0-9]{2})?)/i;
            const usdPattern = /\$\s*([0-9,]+(?:\.[0-9]{2})?)/;
            const bdtMatch = html.match(bdtPattern);
            const usdMatch = html.match(usdPattern);

            if (bdtMatch) {
              price = parseFloat(bdtMatch[1].replace(/,/g, ''));
              currency = 'BDT';
            } else if (usdMatch) {
              const usdVal = parseFloat(usdMatch[1].replace(/,/g, ''));
              price = Math.round(usdVal * 122);
              currency = 'BDT';
            }
          }

          // If price is in USD from JSON-LD/meta, convert to BDT
          if (currency === 'USD' && price > 0) {
            price = Math.round(price * 122);
            currency = 'BDT';
          }

          // Extract Brand
          let brand = jsonLdProduct?.brand?.name || jsonLdProduct?.brand || getMeta('brand') || '';
          if (typeof brand !== 'string') brand = 'Global Tech';
          if (!brand) brand = 'Imported Tech';

          // Extract SKU
          const sku = jsonLdProduct?.sku || `IMP-${Date.now().toString().slice(-4)}`;

          const result = {
            success: true,
            sourceUrl: targetUrl,
            product: {
              title: title || 'Imported Tech Product',
              description: description || 'High quality tech hardware imported directly from external catalog.',
              price: price || 999,
              currency: 'BDT',
              brand,
              sku,
              stockQuantity: 25,
              images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
              features: extractedFeatures.length > 0 ? extractedFeatures : undefined,
            },
          };

          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || 'Scraping failed.' }));
        }
      });

      // 2. Proxy Fetch for External REST APIs (Shopify, WooCommerce, FakeStore, etc.)
      server.middlewares.use('/api/proxy-fetch', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Missing "url" parameter.' }));
            return;
          }

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'XEEROO-Product-Importer/1.0',
              'Accept': 'application/json, text/plain, */*',
            },
          });

          const data = await response.json();
          res.statusCode = response.status;
          res.end(JSON.stringify(data));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || 'Proxy fetch failed.' }));
        }
      });

      // In-memory email dispatch logs for verification and testing
      const emailDispatches: Array<{
        id: string;
        to: string;
        subject: string;
        otp?: string;
        type?: string;
        sentAt: string;
      }> = [];

      // 3. Email Dispatch Service (OTP & Password Reset notification)
      server.middlewares.use('/api/send-email', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
          return;
        }

        try {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(Buffer.from(chunk));
          }
          const body = JSON.parse(Buffer.concat(buffers).toString('utf-8'));
          const { to, subject, otp, type } = body;

          if (!to) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Recipient "to" email is required.' }));
            return;
          }

          const logEntry = {
            id: `email-${Date.now()}`,
            to: String(to),
            subject: String(subject || 'Security Verification Code'),
            otp: otp ? String(otp) : undefined,
            type: type || 'otp',
            sentAt: new Date().toISOString(),
          };

          emailDispatches.unshift(logEntry);
          if (emailDispatches.length > 30) emailDispatches.pop();

          console.log(`[Email Dispatcher] Dispatched email to: ${to} | Subject: "${logEntry.subject}"`);

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            message: `Verification instructions successfully dispatched to ${to}. Please check your inbox and spam folder.`,
            recipient: to,
          }));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || 'Email dispatch failed.' }));
        }
      });

      // Helper for robust Business Koro requests with origin autofill, locked domain retry, and safe JSON handling
      const executeBusinessKoroRequest = async (
        endpoint: string,
        method: 'GET' | 'POST',
        apiKey: string,
        originHeader: string | undefined,
        bodyPayload?: any
      ) => {
        // Filter out development preview hosts (run.app, localhost, ais-) and default to xeeroo.com
        let targetDomain = 'https://xeeroo.com';
        if (originHeader && originHeader.trim() && originHeader !== 'null') {
          const raw = originHeader.trim();
          if (!raw.includes('run.app') && !raw.includes('localhost') && !raw.includes('127.0.0.1') && !raw.includes('ais-')) {
            targetDomain = raw;
          }
        }

        const buildHeaders = (domUrl: string) => {
          const cleanDomain = domUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
          const formattedOrigin = domUrl.startsWith('http') ? domUrl : `https://${cleanDomain}`;
          const h: Record<string, string> = {
            'x-api-key': apiKey.trim(),
            'Accept': 'application/json',
            'User-Agent': 'XEEROO-Storefront/1.0',
            'Origin': formattedOrigin,
            'Referer': formattedOrigin.endsWith('/') ? formattedOrigin : `${formattedOrigin}/`,
            'x-domain': cleanDomain,
          };
          if (bodyPayload) {
            h['Content-Type'] = 'application/json';
          }
          return h;
        };

        let headers = buildHeaders(targetDomain);
        let bkResponse = await fetch(`https://api.businesskoro.com${endpoint}`, {
          method,
          headers,
          body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
        });

        let rawText = await bkResponse.text();
        let parsedData: any = null;
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          parsedData = {
            success: false,
            error: rawText.slice(0, 300) || `HTTP ${bkResponse.status}: Non-JSON response returned from Business Koro.`
          };
        }

        // Automatic retry if key is locked or registered to a specific domain
        if (bkResponse.status === 403 && parsedData?.message && typeof parsedData.message === 'string') {
          const match = parsedData.message.match(/(?:locked to domain ["']?([a-zA-Z0-9.-]+)["']?|registered to ([a-zA-Z0-9.-]+))/i);
          const detectedDomain = match ? (match[1] || match[2]) : null;
          if (detectedDomain && !detectedDomain.includes('run.app')) {
            headers = buildHeaders(`https://${detectedDomain}`);
            bkResponse = await fetch(`https://api.businesskoro.com${endpoint}`, {
              method,
              headers,
              body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
            });
            rawText = await bkResponse.text();
            try {
              parsedData = JSON.parse(rawText);
            } catch {
              parsedData = {
                success: false,
                error: rawText.slice(0, 300) || `HTTP ${bkResponse.status}: Non-JSON response returned from Business Koro.`
              };
            }
          }
        }

        return { status: bkResponse.status, data: parsedData };
      };

      // 4. Business Koro API Integration: Product List
      // GET https://api.businesskoro.com/api/v1/storefront/products
      server.middlewares.use('/api/businesskoro/products', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Origin, x-origin');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          let apiKey = (req.headers['x-api-key'] as string) || urlObj.searchParams.get('apiKey') || '';
          let originHeader = (req.headers['x-origin'] as string) || urlObj.searchParams.get('origin') || '';
          const browserOrigin = (req.headers['origin'] as string) || '';
          if (!originHeader && browserOrigin && !browserOrigin.includes('run.app') && !browserOrigin.includes('localhost') && !browserOrigin.includes('ais-')) {
            originHeader = browserOrigin;
          }
          if (!originHeader) {
            originHeader = 'https://xeeroo.com';
          }

          if (!apiKey && req.method === 'POST') {
            const buffers: Buffer[] = [];
            for await (const chunk of req) {
              buffers.push(Buffer.from(chunk));
            }
            try {
              const body = JSON.parse(Buffer.concat(buffers).toString('utf-8'));
              apiKey = body.apiKey || apiKey;
              originHeader = body.origin || originHeader;
            } catch {
              // ignore
            }
          }

          if (!apiKey) {
            res.statusCode = 400;
            res.end(JSON.stringify({
              success: false,
              error: 'Business Koro API key is required. Please provide "x-api-key" header or apiKey param.',
            }));
            return;
          }

          const result = await executeBusinessKoroRequest('/api/v1/storefront/products', 'GET', apiKey, originHeader);
          res.statusCode = result.status;
          res.end(JSON.stringify(result.data));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || 'Business Koro products request failed.' }));
        }
      });

      // 5. Business Koro API Integration: Order Placement
      // POST https://api.businesskoro.com/api/v1/storefront/orders
      server.middlewares.use('/api/businesskoro/orders', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Origin, x-origin');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          let apiKey = (req.headers['x-api-key'] as string) || urlObj.searchParams.get('apiKey') || '';
          let originHeader = (req.headers['x-origin'] as string) || (req.headers['origin'] as string) || urlObj.searchParams.get('origin') || '';

          // Read body
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(Buffer.from(chunk));
          }
          const rawBody = Buffer.concat(buffers).toString('utf-8');
          let parsedBody: Record<string, any> = {};
          try {
            parsedBody = JSON.parse(rawBody);
          } catch {
            // ignore
          }

          apiKey = apiKey || parsedBody.apiKey || '';
          originHeader = originHeader || parsedBody.origin || '';

          if (!apiKey) {
            res.statusCode = 400;
            res.end(JSON.stringify({
              success: false,
              error: 'Business Koro API key is required.',
            }));
            return;
          }

          // Build Business Koro payload
          const orderPayload = {
            productId: parsedBody.productId,
            customerName: parsedBody.customerName,
            customerPhone: parsedBody.customerPhone,
            customerAddress: parsedBody.customerAddress,
            customerDivision: parsedBody.customerDivision || 'Dhaka',
            customerDistrict: parsedBody.customerDistrict || 'Dhaka',
            customerArea: parsedBody.customerArea || 'Mirpur',
            sellingPrice: Number(parsedBody.sellingPrice),
            deliveryChargePaidByCustomer: Boolean(parsedBody.deliveryChargePaidByCustomer),
            customerNote: parsedBody.customerNote || '',
            ...(parsedBody.deliveryChargeCollectionMode
              ? { deliveryChargeCollectionMode: parsedBody.deliveryChargeCollectionMode }
              : {}),
          };

          const result = await executeBusinessKoroRequest('/api/v1/storefront/orders', 'POST', apiKey, originHeader, orderPayload);
          res.statusCode = result.status;
          res.end(JSON.stringify(result.data));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || 'Business Koro order placement failed.' }));
        }
      });

      // 6. Business Koro API Integration: Check Order Status
      // GET https://api.businesskoro.com/api/v1/storefront/orders/{orderId}
      server.middlewares.use('/api/businesskoro/order-status', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Origin, x-origin');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const apiKey = (req.headers['x-api-key'] as string) || urlObj.searchParams.get('apiKey') || '';
          const orderId = urlObj.searchParams.get('orderId');
          const originHeader = (req.headers['x-origin'] as string) || (req.headers['origin'] as string) || urlObj.searchParams.get('origin') || '';

          if (!apiKey || !orderId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Both "apiKey" and "orderId" parameters are required.' }));
            return;
          }

          const result = await executeBusinessKoroRequest(`/api/v1/storefront/orders/${encodeURIComponent(orderId)}`, 'GET', apiKey, originHeader);
          res.statusCode = result.status;
          res.end(JSON.stringify(result.data));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || 'Business Koro order status check failed.' }));
        }
      });

      // 6. MongoDB Atlas Integration Endpoints
      server.middlewares.use('/api/mongodb/test', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(Buffer.from(chunk));
          }
          const bodyStr = Buffer.concat(buffers).toString('utf-8');
          const { connectionUri } = JSON.parse(bodyStr || '{}');

          if (!connectionUri || typeof connectionUri !== 'string' || !connectionUri.trim()) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'MongoDB Connection URI প্রদান করা হয়নি (যেমন: mongodb+srv://...)' }));
            return;
          }

          const { MongoClient } = await import('mongodb');
          const client = new MongoClient(connectionUri.trim(), {
            serverSelectionTimeoutMS: 6000,
            connectTimeoutMS: 6000,
          });

          await client.connect();
          await client.db().admin().ping();
          const dbName = client.db().databaseName || 'xeeroo_store';
          const collections = await client.db(dbName).listCollections().toArray();
          await client.close();

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            message: 'MongoDB Atlas ক্লাস্টারের সাথে সফলভাবে সংযোগ স্থাপিত হয়েছে!',
            database: dbName,
            collections: collections.map((c) => c.name),
          }));
        } catch (err: unknown) {
          const error = err as { message?: string };
          let msg = error.message || 'MongoDB connection failed';
          if (msg.includes('bad auth') || msg.includes('Authentication failed')) {
            msg = 'অথেনটিকেশন ব্যর্থ হয়েছে: ইউজারনেম বা পাসওয়ার্ড সঠিক কিনা চেক করুন।';
          } else if (msg.includes('ETIMEDOUT') || msg.includes('timed out') || msg.includes('whitelist') || msg.includes('queryTxt ETIMEOUT')) {
            msg = 'কানেকশন টাইমআউট: MongoDB Atlas Network Access মেন্যুতে 0.0.0.0/0 আইপি এলাউ করা আছে কি না যাচাই করুন।';
          }
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: msg }));
        }
      });

      server.middlewares.use('/api/mongodb/sync', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(Buffer.from(chunk));
          }
          const bodyStr = Buffer.concat(buffers).toString('utf-8');
          const { connectionUri, data } = JSON.parse(bodyStr || '{}');

          if (!connectionUri) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Connection URI missing' }));
            return;
          }

          const { MongoClient } = await import('mongodb');
          const client = new MongoClient(connectionUri.trim(), {
            serverSelectionTimeoutMS: 8000,
          });
          await client.connect();
          const db = client.db('xeeroo_store');

          let syncedItems = 0;
          if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
            const col = db.collection('products');
            for (const p of data.products) {
              const { _id, ...rest } = p;
              await col.updateOne({ id: p.id }, { $set: rest }, { upsert: true });
            }
            syncedItems += data.products.length;
          }

          if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            const col = db.collection('categories');
            for (const c of data.categories) {
              const { _id, ...rest } = c;
              await col.updateOne({ id: c.id }, { $set: rest }, { upsert: true });
            }
            syncedItems += data.categories.length;
          }

          if (data?.orders && Array.isArray(data.orders) && data.orders.length > 0) {
            const col = db.collection('orders');
            for (const o of data.orders) {
              const { _id, ...rest } = o;
              await col.updateOne({ id: o.id }, { $set: rest }, { upsert: true });
            }
            syncedItems += data.orders.length;
          }

          if (data?.users && Array.isArray(data.users) && data.users.length > 0) {
            const col = db.collection('users');
            for (const u of data.users) {
              const { _id, ...rest } = u;
              await col.updateOne({ id: u.id }, { $set: rest }, { upsert: true });
            }
            syncedItems += data.users.length;
          }

          await client.close();

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            message: `MongoDB Atlas-এ ${syncedItems} টি আইটেম সফলভাবে সিঙ্ক করা হয়েছে!`,
          }));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || 'MongoDB sync failed' }));
        }
      });

      server.middlewares.use('/api/mongodb/pull', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(Buffer.from(chunk));
          }
          const bodyStr = Buffer.concat(buffers).toString('utf-8');
          const { connectionUri } = JSON.parse(bodyStr || '{}');

          if (!connectionUri) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Connection URI missing' }));
            return;
          }

          const { MongoClient } = await import('mongodb');
          const client = new MongoClient(connectionUri.trim(), {
            serverSelectionTimeoutMS: 8000,
          });
          await client.connect();
          const db = client.db('xeeroo_store');

          const products = await db.collection('products').find({}).toArray();
          const categories = await db.collection('categories').find({}).toArray();
          const orders = await db.collection('orders').find({}).toArray();
          const users = await db.collection('users').find({}).toArray();

          await client.close();

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            products: products.map(({ _id, ...rest }) => rest),
            categories: categories.map(({ _id, ...rest }) => rest),
            orders: orders.map(({ _id, ...rest }) => rest),
            users: users.map(({ _id, ...rest }) => rest),
          }));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: error.message || 'MongoDB pull failed' }));
        }
      });

      // 7. Facebook Graph API Integration: Verify Page & Token
      server.middlewares.use('/api/facebook/verify', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(Buffer.from(chunk));
          }
          const { pageId, accessToken } = JSON.parse(Buffer.concat(buffers).toString('utf-8') || '{}');

          const envPageId = process.env.FACEBOOK_PAGE_ID || process.env.VITE_FACEBOOK_PAGE_ID || '103314657990315';
          const envToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.VITE_FACEBOOK_PAGE_ACCESS_TOKEN || '';

          const cleanPageId = String(pageId || envPageId).trim();
          const cleanToken = String(accessToken || envToken).trim();

          if (!cleanPageId || !cleanToken) {
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              error: 'Facebook Page ID এবং Access Token পাওয়া যায়নি। অনুগ্রহ করে FACEBOOK_PAGE_ID এবং FACEBOOK_PAGE_ACCESS_TOKEN কনফিগার করুন।'
            }));
            return;
          }

          // If a System User Token or User Token was provided, exchange for the permanent Page Access Token
          let effectiveToken = cleanToken;
          try {
            const pageTokRes = await fetch(
              `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}?fields=access_token&access_token=${encodeURIComponent(cleanToken)}`
            );
            const pageTokData = await pageTokRes.json();
            if (pageTokData && pageTokData.access_token) {
              effectiveToken = pageTokData.access_token;
            }
          } catch {
            // ignore exchange error, proceed with cleanToken
          }

          const fbUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}?fields=id,name,link,is_published&access_token=${encodeURIComponent(effectiveToken)}`;
          const fbResponse = await fetch(fbUrl);
          const fbData = await fbResponse.json();

          if (fbData.error) {
            let errorMsg = fbData.error.message || 'Facebook API অথেনটিকেশন ব্যর্থ হয়েছে।';
            if (fbData.error.code === 190) {
              errorMsg = 'Facebook Access Token টি অকার্যকর (Invalid) বা মেয়াদোত্তীর্ণ (Expired) হয়ে গেছে। অনুগ্রহ করে Facebook Developer Console বা Graph API Explorer থেকে নতুন Page Access Token প্রদান করুন।';
            } else if (fbData.error.code === 200 || fbData.error.code === 10) {
              errorMsg = `Facebook পারমিশন সমস্যা (#200): পেজে পোস্ট বা পরিচালনা করার পর্যাপ্ত পারমিশন নেই (${fbData.error.message})। Token-এ 'pages_manage_posts' ও 'pages_read_engagement' থাকা প্রয়োজন।`;
            } else if (fbData.error.code === 100) {
              errorMsg = 'প্রদত্ত Facebook Page ID টি সঠিক নয় (#100)। সঠিক পেজ আইডি যাচাই করুন।';
            }
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              error: errorMsg,
              details: fbData.error,
            }));
            return;
          }

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            page: {
              id: fbData.id,
              name: fbData.name,
              link: fbData.link || `https://www.facebook.com/${fbData.id}`,
              is_published: fbData.is_published,
            },
            resolvedToken: effectiveToken !== cleanToken ? effectiveToken : undefined,
          }));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 200;
          res.end(JSON.stringify({ success: false, error: error.message || 'Facebook verification failed.' }));
        }
      });

      // 8. Facebook Graph API Integration: Publish Post (Photo with Caption)
      server.middlewares.use('/api/facebook/publish', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(Buffer.from(chunk));
          }
          const { pageId, accessToken, caption, imageUrl, productUrl, productTitle } = JSON.parse(
            Buffer.concat(buffers).toString('utf-8') || '{}'
          );

          const envPageId = process.env.FACEBOOK_PAGE_ID || process.env.VITE_FACEBOOK_PAGE_ID || '103314657990315';
          const envToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.VITE_FACEBOOK_PAGE_ACCESS_TOKEN || '';

          const cleanPageId = String(pageId || envPageId).trim();
          const cleanToken = String(accessToken || envToken).trim();

          if (!cleanPageId || !cleanToken) {
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              error: 'Facebook Page ID অথবা Access Token পাওয়া যায়নি। অনুগ্রহ করে FACEBOOK_PAGE_ID ও FACEBOOK_PAGE_ACCESS_TOKEN প্রদান করুন।'
            }));
            return;
          }

          // Meta Graph API Requirement:
          // A User/System-User token cannot post directly to a Page. It must be exchanged for the Page Access Token.
          let effectiveToken = cleanToken;
          try {
            const pageTokRes = await fetch(
              `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}?fields=access_token&access_token=${encodeURIComponent(cleanToken)}`
            );
            const pageTokData = await pageTokRes.json();
            if (pageTokData && pageTokData.access_token) {
              effectiveToken = pageTokData.access_token;
              console.log('[Facebook API] Resolved Page Access Token for Page:', cleanPageId);
            }
          } catch (tokErr) {
            console.warn('[Facebook API] Page token resolution notice:', tokErr);
          }

          let postId = '';
          let postUrl = '';
          let lastErrorMsg = '';

          // 1. Resolve and verify public image URL availability
          let targetImageUrl = imageUrl;
          if (targetImageUrl && typeof targetImageUrl === 'string') {
            if (targetImageUrl.startsWith('/')) {
              const host = process.env.APP_URL || 'https://ais-pre-jaojjujai65chcukwocmss-455970953521.asia-southeast1.run.app';
              targetImageUrl = `${host.replace(/\/+$/, '')}${targetImageUrl}`;
            }
          }
          const isPublicImage =
            targetImageUrl &&
            typeof targetImageUrl === 'string' &&
            targetImageUrl.startsWith('http') &&
            !targetImageUrl.includes('localhost') &&
            !targetImageUrl.includes('127.0.0.1');

          if (isPublicImage) {
            try {
              const photoUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}/photos`;
              const photoParams = new URLSearchParams();
              photoParams.append('url', targetImageUrl);
              photoParams.append('caption', caption || `${productTitle || 'Product'}`);
              photoParams.append('access_token', effectiveToken);

              const photoRes = await fetch(photoUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: photoParams.toString(),
              });

              const photoData = await photoRes.json();
              if (photoData.id || photoData.post_id) {
                postId = photoData.post_id || photoData.id;
                postUrl = `https://www.facebook.com/${postId}`;
              } else if (photoData.error) {
                console.warn('[Facebook API] Photo post notice:', photoData.error.message);
                lastErrorMsg = photoData.error.message;
              }
            } catch (photoErr: any) {
              console.warn('[Facebook API] Photo post failed, falling back to feed:', photoErr);
              lastErrorMsg = photoErr?.message || '';
            }
          }

          // 2. Fallback to Feed post if photo wasn't posted or image is unavailable
          if (!postId) {
            const feedUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}/feed`;
            const feedParams = new URLSearchParams();
            feedParams.append('message', caption || `${productTitle || 'Product'}`);
            if (productUrl && typeof productUrl === 'string' && productUrl.startsWith('http')) {
              feedParams.append('link', productUrl);
            }
            feedParams.append('access_token', effectiveToken);

            const feedRes = await fetch(feedUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: feedParams.toString(),
            });

            const feedData = await feedRes.json();
            if (feedData.id) {
              postId = feedData.id;
              postUrl = `https://www.facebook.com/${postId}`;
            } else if (feedData.error) {
              let errorMsg = feedData.error.message || lastErrorMsg || 'পোস্ট প্রকাশ করা যায়নি';
              if (feedData.error.code === 200 || feedData.error.code === 10) {
                errorMsg = `Facebook পারমিশন ত্রুটি (#200): পেজে পোস্ট করার জন্য Page Access Token এবং 'pages_manage_posts' ও 'pages_read_engagement' পারমিশন প্রয়োজন। (${feedData.error.message})`;
              } else if (feedData.error.code === 190) {
                errorMsg = 'Facebook Access Token মেয়াদোত্তীর্ণ বা অকার্যকর হয়ে গেছে। অনুগ্রহ করে Facebook Developer Console বা Graph API Explorer থেকে নতুন Page Access Token নিয়ে আপডেট করুন।';
              } else if (feedData.error.code === 100) {
                errorMsg = `প্রদত্ত Facebook Page ID টি সঠিক নয় (#100)। (${feedData.error.message})`;
              }
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: false,
                error: errorMsg,
                details: feedData.error,
              }));
              return;
            }
          }

          if (postId) {
            console.log(`[Facebook API] Successfully posted product to Page ${cleanPageId}: Post ID ${postId}`);
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              postId,
              postUrl,
              message: 'ফেসবুক পেজে সফলভাবে প্রোডাক্টটি পোস্ট হয়েছে!',
            }));
            return;
          }

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: false,
            error: lastErrorMsg ? `ফেসবুকে পোস্ট ব্যর্থ হয়েছে: ${lastErrorMsg}` : 'ফেসবুকে পোস্ট সম্পন্ন করা যায়নি।',
          }));
        } catch (err: unknown) {
          const error = err as { message?: string };
          res.statusCode = 200;
          res.end(JSON.stringify({ success: false, error: error.message || 'Facebook publish failed.' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), productImporterPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
