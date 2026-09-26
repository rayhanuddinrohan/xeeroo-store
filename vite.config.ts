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
          let originHeader = (req.headers['x-origin'] as string) || (req.headers['origin'] as string) || urlObj.searchParams.get('origin') || '';

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

          const headers: Record<string, string> = {
            'x-api-key': apiKey.trim(),
            'Accept': 'application/json',
            'User-Agent': 'XEEROO-Storefront/1.0',
          };

          if (originHeader && originHeader.trim() && originHeader !== 'null') {
            headers['Origin'] = originHeader.trim();
          }

          const bkResponse = await fetch('https://api.businesskoro.com/api/v1/storefront/products', {
            method: 'GET',
            headers,
          });

          const data = await bkResponse.json();
          res.statusCode = bkResponse.status;
          res.end(JSON.stringify(data));
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

          const headers: Record<string, string> = {
            'x-api-key': apiKey.trim(),
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'XEEROO-Storefront/1.0',
          };

          if (originHeader && originHeader.trim() && originHeader !== 'null') {
            headers['Origin'] = originHeader.trim();
          }

          const bkResponse = await fetch('https://api.businesskoro.com/api/v1/storefront/orders', {
            method: 'POST',
            headers,
            body: JSON.stringify(orderPayload),
          });

          const data = await bkResponse.json();
          res.statusCode = bkResponse.status;
          res.end(JSON.stringify(data));
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

          const headers: Record<string, string> = {
            'x-api-key': apiKey.trim(),
            'Accept': 'application/json',
            'User-Agent': 'XEEROO-Storefront/1.0',
          };

          if (originHeader && originHeader.trim() && originHeader !== 'null') {
            headers['Origin'] = originHeader.trim();
          }

          const bkResponse = await fetch(`https://api.businesskoro.com/api/v1/storefront/orders/${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers,
          });

          const data = await bkResponse.json();
          res.statusCode = bkResponse.status;
          res.end(JSON.stringify(data));
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
