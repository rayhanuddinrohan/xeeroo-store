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

          // Fetch the external webpage with a standard browser User-Agent
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(JSON.stringify({ success: false, error: `Website returned status: ${response.status} ${response.statusText}` }));
            return;
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

          // Extract Images
          const images: string[] = [];
          if (jsonLdProduct?.image) {
            if (Array.isArray(jsonLdProduct.image)) {
              jsonLdProduct.image.forEach((img: any) => {
                const src = typeof img === 'string' ? img : img?.url;
                if (src && !images.includes(src)) images.push(src);
              });
            } else if (typeof jsonLdProduct.image === 'string') {
              images.push(jsonLdProduct.image);
            } else if (jsonLdProduct.image?.url) {
              images.push(jsonLdProduct.image.url);
            }
          }

          const ogImage = getMeta('image');
          if (ogImage && !images.includes(ogImage)) {
            images.unshift(ogImage);
          }

          // Also look for prominent product images if needed
          const imgMatches = html.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|avif)[^"']*)["']/gi);
          for (const m of imgMatches) {
            const url = m[1];
            if (
              !url.includes('icon') &&
              !url.includes('logo') &&
              !url.includes('avatar') &&
              !url.includes('banner') &&
              images.length < 5 &&
              !images.includes(url)
            ) {
              images.push(url);
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
              price = parseFloat(usdMatch[1].replace(/,/g, ''));
              currency = 'USD';
            }
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
              currency,
              brand,
              sku,
              stockQuantity: 25,
              images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
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
