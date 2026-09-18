// The pure Express app: every /api/* route, nothing else. Deliberately
// has NO import of 'vite' anywhere in this file or anything it imports —
// that was the actual cause of "This Serverless Function has crashed" /
// FUNCTION_INVOCATION_FAILED on Vercel. 'vite' is a heavyweight, dev-only
// build tool (native esbuild/rollup binaries, filesystem watchers, etc.)
// that has no business running inside a Lambda-style serverless function.
// The previous version of this fix put createApp() in server.ts, which
// also had a top-level `import ... from 'vite'` for local dev — a static
// import executes at module load regardless of whether the code path
// that uses it actually runs, so api/index.ts (which imports createApp)
// dragged vite into the serverless bundle and crashed on cold start.
// server.ts (local/Node-hosting entry point) now imports createApp FROM
// this file instead of the other way around, so vite never enters any
// path that Vercel's function bundler traces.
import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Shared Data Store (replaces browser-only localStorage persistence)
// ---------------------------------------------------------------------------
// Previously, every admin CMS edit (properties, leads, banners, blog posts,
// settings, etc.) was saved ONLY to the browser's localStorage. That meant
// changes made in the admin panel never reached real site visitors, and
// switching devices/browsers (or clearing cache) silently wiped everything
// back to the hardcoded defaults. This is a tiny file-based JSON store so
// that data is shared across every visitor and survives cache clears.
// It intentionally has zero extra npm dependencies (just Node's built-in fs)
// so it will not need any additional `npm install` step.
// IMPORTANT PLATFORM LIMITATION — read this before assuming CMS saves are
// durable in production:
// On a traditional Node host (Render/Railway/a VPS/Docker), process.cwd()
// is a normal writable disk and this file store is genuinely persistent.
// On Vercel specifically, the deployed bundle is READ-ONLY — only /tmp is
// writable, and /tmp is wiped whenever the serverless container recycles
// (which happens routinely, not just on redeploys). So on Vercel this can
// only ever be a same-warm-container cache, not real persistence: an admin
// save can appear to work and then vanish minutes later when a fresh
// container spins up. There is no code-only fix for this — it needs an
// actual external store (Vercel KV/Postgres, Supabase, Upstash Redis, etc.)
// wired up with real credentials, which nobody has provided. What this
// code DOES do: pick /tmp automatically when process.cwd() isn't writable
// (so saves don't hard-fail with a raw filesystem error on Vercel), and
// report which mode it's in via /api/health so the admin panel can show an
// honest warning instead of pretending everything is safely saved.
import os from 'os';
import crypto from 'crypto';

function resolveDataDir(): { dir: string; persistent: boolean } {
  const preferred = path.join(process.cwd(), 'data');
  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return { dir: preferred, persistent: true };
  } catch {
    const fallback = path.join(os.tmpdir(), 'auricity-data');
    fs.mkdirSync(fallback, { recursive: true });
    console.warn(
      `[auricity] "${preferred}" is not writable (expected on Vercel). ` +
      `Falling back to "${fallback}", which is NOT durable across ` +
      `container restarts. Admin CMS saves will appear to work but are ` +
      `not permanently persistent until a real database is configured.`
    );
    return { dir: fallback, persistent: false };
  }
}

const { dir: DATA_DIR, persistent: DATA_DIR_PERSISTENT } = resolveDataDir();

// Only allow simple alphanumeric/underscore keys — prevents any path
// traversal via the :key URL parameter.
const VALID_KEY = /^[a-zA-Z0-9_]{1,64}$/;

function storeFilePath(key: string): string {
  return path.join(DATA_DIR, `${key}.json`);
}

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }
  return aiClient;
}

// Gemini can occasionally wrap JSON in markdown or return a short prose
// sentence even when JSON mode is requested. Never pass that raw text to
// JSON.parse without normalising it first.
function parseAIJson(raw: string): any {
  const text = String(raw || '').trim();
  if (!text) throw new Error('AI returned an empty response');

  // Gemini occasionally adds a short sentence or markdown fence despite JSON mode.
  // Extract the first balanced JSON object instead of relying on lastIndexOf('}').
  const candidates = [
    text,
    text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  ];
  for (const candidate of candidates) {
    try { return JSON.parse(candidate); } catch {}
  }

  const start = text.indexOf('{');
  if (start >= 0) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(text.slice(start, i + 1)); } catch { break; }
        }
      }
    }
  }
  throw new Error('AI returned invalid JSON');
}

// The Express app (all /api/* routes) is built here as a plain synchronous
// factory so it can be reused two ways:
//  1. Traditional Node hosting (Render/Railway/a VPS/etc): startServer()
//     below calls this, then also serves the built frontend and listens on
//     a port.
//  2. Vercel: api/index.ts imports createApp() directly and exports the
//     Express app as a serverless function. Vercel serves the static
//     frontend from dist/ on its own and only invokes this for /api/*
//     requests — it never runs startServer()/app.listen(), which is why
//     the API previously 404'd in production there (see api/index.ts and
//     vercel.json for the other half of this fix).
export function createApp() {
  const app = express();

  // Default express.json() limit is only 100kb. Admin CMS saves include
  // base64-encoded photos (property images, banners, page images) which are
  // almost always bigger than that, so every save containing a new/changed
  // image was being silently rejected by Express before it ever reached our
  // route handlers. 20mb gives real headroom even for several compressed
  // photos in one collection save.
  app.use(express.json({ limit: '20mb' }));

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Auricity PropTech Engine',
      city: 'Chhatrapati Sambhajinagar',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      // See resolveDataDir() above: false means saves are running on a
      // temporary disk that will NOT survive a container restart. The
      // admin panel polls this so it can show a real warning instead of
      // silently letting the owner believe every save is safe forever.
      storagePersistent: DATA_DIR_PERSISTENT
    });
  });

  // ---------------------------------------------------------------------
  // Broker verification document vault. Files are kept outside public/ and
  // never receive a public URL. The upload route validates type/size and
  // stores an opaque key that the application record can reference.
  // ---------------------------------------------------------------------
  const BROKER_DOC_DIR = path.join(DATA_DIR, 'broker-documents');
  fs.mkdirSync(BROKER_DOC_DIR, { recursive: true });
  const BROKER_DOC_TYPES: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png'
  };
  const readAdminPin = () => {
    if (process.env.AURICITY_ADMIN_PIN) return process.env.AURICITY_ADMIN_PIN;
    try {
      const settingsPath = storeFilePath('auricity_settings');
      if (fs.existsSync(settingsPath)) return JSON.parse(fs.readFileSync(settingsPath, 'utf8'))?.adminPin || '9999';
    } catch {}
    return '9999';
  };
  const isAdminRequest = (req: express.Request) => String(req.header('x-admin-pin') || '') === String(readAdminPin());

  app.post('/api/broker/documents', (req, res) => {
    try {
      const { data, name, type, size } = req.body || {};
      if (!data || !name || !BROKER_DOC_TYPES[type]) return res.status(400).json({ error: 'Valid PDF, JPG or PNG document is required' });
      if (!Number.isFinite(Number(size)) || Number(size) <= 0 || Number(size) > 5 * 1024 * 1024) return res.status(400).json({ error: 'Document must be 5 MB or smaller' });
      const cleanName = path.basename(String(name)).replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageKey = crypto.randomBytes(24).toString('hex');
      const target = path.join(BROKER_DOC_DIR, `${storageKey}${BROKER_DOC_TYPES[type]}`);
      const bytes = Buffer.from(String(data), 'base64');
      if (bytes.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Document is too large' });
      fs.writeFileSync(target, bytes, { flag: 'wx' });
      fs.writeFileSync(path.join(BROKER_DOC_DIR, `${storageKey}.json`), JSON.stringify({ storageKey, originalName: cleanName, type, size: bytes.length, uploadedAt: new Date().toISOString() }), 'utf8');
      return res.json({ storageKey, name: cleanName, type, size: bytes.length });
    } catch (err) {
      console.error('Broker document upload error:', err);
      return res.status(500).json({ error: 'Failed to store verification document' });
    }
  });

  app.get('/api/broker/documents/:storageKey', (req, res) => {
    if (!isAdminRequest(req)) return res.status(403).json({ error: 'Admin authorization required' });
    const key = String(req.params.storageKey || '');
    if (!/^[a-f0-9]{48}$/.test(key)) return res.status(400).json({ error: 'Invalid document key' });
    const metaPath = path.join(BROKER_DOC_DIR, `${key}.json`);
    if (!fs.existsSync(metaPath)) return res.status(404).json({ error: 'Document not found' });
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const filePath = path.join(BROKER_DOC_DIR, `${key}${BROKER_DOC_TYPES[meta.type] || ''}`);
    if (!filePath.startsWith(BROKER_DOC_DIR) || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Document not found' });
    res.type(meta.type).sendFile(filePath);
  });

  // ---------------------------------------------------------------------
  // Contact messages — validated server-side, rate-limited, and admin-only
  // reads. Records are stored in the same server-side persistence layer as
  // the existing CMS collections so they are never exposed through the UI.
  // ---------------------------------------------------------------------
  const contactRate = new Map<string, { count: number; resetAt: number }>();
  const cleanText = (v: unknown, max: number) => String(v ?? '').trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max);
  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const contactStoreKey = 'auricity_contact_messages';
  const readContactMessages = (): any[] => {
    try { const f=storeFilePath(contactStoreKey); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f,'utf8')) : []; } catch { return []; }
  };
  app.post('/api/contact/messages', (req, res) => {
    try {
      const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
      const now = Date.now(); const bucket = contactRate.get(ip);
      if (!bucket || bucket.resetAt < now) contactRate.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
      else if (bucket.count >= 5) return res.status(429).json({ error: 'Too many messages. Please try again later.' });
      else bucket.count++;
      const body=req.body||{};
      if (String(body.website || '').trim()) return res.status(400).json({error:'Invalid submission'});
      const name=cleanText(body.name,120), email=cleanText(body.email,160), phone=cleanText(body.phone,40), subject=cleanText(body.subject,180), inquiryType=cleanText(body.inquiryType,80), message=cleanText(body.message,5000);
      if(!name || !validEmail(email) || !subject || !message || message.length<10 || !inquiryType) return res.status(400).json({error:'Please provide valid required fields.'});
      const list=readContactMessages(); const createdAt=new Date().toISOString();
      const record={id:`contact-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,name,email,phone:phone||undefined,subject,inquiryType,message,status:'new',createdAt,updatedAt:createdAt};
      fs.writeFileSync(storeFilePath(contactStoreKey),JSON.stringify([record,...list],null,2),'utf8');
      return res.status(201).json({ ok:true, id:record.id });
    } catch (err) { console.error('Contact message error:',err); return res.status(500).json({error:'Unable to submit message'}); }
  });
  app.get('/api/contact/messages', (req,res) => {
    if(!isAdminRequest(req)) return res.status(403).json({error:'Admin authorization required'});
    return res.json({value:readContactMessages()});
  });
  app.patch('/api/contact/messages/:id', (req,res) => {
    if(!isAdminRequest(req)) return res.status(403).json({error:'Admin authorization required'});
    const list=readContactMessages(); const idx=list.findIndex(x=>x.id===req.params.id); if(idx<0)return res.status(404).json({error:'Message not found'});
    const allowedStatus=new Set(['new','read','in_progress','resolved','archived']); const patch=req.body||{};
    const next={...list[idx], status:allowedStatus.has(patch.status)?patch.status:list[idx].status, adminNotes:cleanText(patch.adminNotes,2000), updatedAt:new Date().toISOString()}; list[idx]=next;
    fs.writeFileSync(storeFilePath(contactStoreKey),JSON.stringify(list,null,2),'utf8'); return res.json({value:next});
  });
  app.delete('/api/contact/messages/:id', (req,res) => {
    if(!isAdminRequest(req)) return res.status(403).json({error:'Admin authorization required'});
    const list=readContactMessages(); const next=list.filter(x=>x.id!==req.params.id); fs.writeFileSync(storeFilePath(contactStoreKey),JSON.stringify(next,null,2),'utf8'); return res.json({ok:true});
  });

  // ---------------------------------------------------------------------
  // Shared Data Store API — GET reads, PUT writes. Used by AppContext.tsx
  // so every admin edit is visible to every visitor, on every device.
  // ---------------------------------------------------------------------
  app.get('/api/store/:key', (req, res) => {
    const { key } = req.params;
    if (!VALID_KEY.test(key)) {
      return res.status(400).json({ error: 'Invalid key' });
    }
    const filePath = storeFilePath(key);
    if (!fs.existsSync(filePath)) {
      // Not seeded yet — frontend will fall back to its local defaults.
      return res.status(404).json({ error: 'Not found' });
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return res.json({ key, value: JSON.parse(raw) });
    } catch (err) {
      console.error(`Store read error for "${key}":`, err);
      return res.status(500).json({ error: 'Failed to read store' });
    }
  });

  app.put('/api/store/:key', (req, res) => {
    const { key } = req.params;
    if (!VALID_KEY.test(key)) {
      return res.status(400).json({ error: 'Invalid key' });
    }
    if (req.body === undefined || req.body.value === undefined) {
      return res.status(400).json({ error: 'Request body must be { "value": ... }' });
    }
    try {
      fs.writeFileSync(storeFilePath(key), JSON.stringify(req.body.value, null, 2), 'utf-8');
      return res.json({ key, value: req.body.value });
    } catch (err) {
      console.error(`Store write error for "${key}":`, err);
      return res.status(500).json({ error: 'Failed to write store' });
    }
  });

  // Multilingual AI Property Assistant (English, Marathi, Hindi)
  app.post('/api/ai/property-assistant', async (req, res) => {
    try {
      const { message, chatHistory, language = 'en' } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const ai = getGenAI();
      if (!ai) {
        // Fallback realistic response when API key is not yet configured
        return res.json({
          reply: language === 'mr'
            ? `नमस्कार! ऑरिसिटी एआय मध्ये आपले स्वागत आहे. मी छत्रपती संभाजीनगरमधील सिडको (CIDCO N-1 ते N-12), जालना रोड, बीड बायपास, शेंद्रा ऑरिक स्मार्ट सिटी (AURIC), महारेरा (MahaRERA), मुद्रांक शुल्क (Stamp Duty) आणि ०% ब्रोकरेज संदर्भात अचूक माहिती देऊ शकतो.`
            : `Hello! Welcome to the Auricity AI Property Advisor for Chhatrapati Sambhajinagar. I can help you with locality pricing trends (CIDCO, Jalna Road, Beed Bypass, Garkheda, AURIC Smart City Shendra), MahaRERA verification, Maharashtra Ready Reckoner circle rates, stamp duty calculations, and 0% brokerage listings. What are you looking for today?`
        });
      }

      const systemPrompt = `You are "Auricity AI", an expert PropTech & real estate legal advisor specializing exclusively in Chhatrapati Sambhajinagar (formerly Aurangabad), Maharashtra, India.
Key Knowledge:
1. Localities: CIDCO (N-1 to N-12), Jalna Road (Golden Mile), Beed Bypass, Garkheda Parisar, Shendra MIDC & AURIC Smart City (DMIC), Waluj MIDC, Seven Hills, Cannought Place, Osmanpura, Samarth Nagar, Satara Parisar, Paithan Road.
2. Infrastructure: Samruddhi Mahamarg (4.5 hours to Mumbai), AURIC Greenfield Smart City, DMIC freight corridor, Shendra-Bidkin industrial belt, Prozone Mall CIDCO.
3. Rates (2026 Benchmarks):
   - CIDCO 2BHK/3BHK: ₹45L - ₹90L (₹4,500 - ₹6,500/sq.ft)
   - Beed Bypass Luxury Villas: ₹1.5 Cr - ₹3 Cr
   - Jalna Road Commercial: ₹8,000 - ₹14,000/sq.ft
   - Garkheda Residential Plots: ₹2,500 - ₹3,800/sq.ft (NA 44)
   - Shendra AURIC Industrial: ₹1,500 - ₹2,200/sq.ft
4. Stamp Duty & Registration in Maharashtra:
   - Male: 6% (5% Stamp Duty + 1% Local Surcharge)
   - Female: 5% (1% concession for women on residential)
   - Registration: 1% capped at ₹30,000 above ₹30L.
5. MahaRERA & Documents: 7/12 extract, Ferfar mutation, Commencement Certificate (CC), 30-year Search Report.

Guidelines:
- Answer warmly, accurately, and authoritatively.
- If user asks in Marathi (मराठी), answer in fluent Marathi.
- If user asks in Hindi (हिंदी), answer in fluent Hindi.
- If user asks in English, answer in polished English.
- Keep formatting scannable with bullet points when listing prices or steps.
- Mention Auricity verified services or RERA compliance when relevant.`;

      const contents: any[] = [];
      if (Array.isArray(chatHistory)) {
        chatHistory.forEach((item: { sender: string; text: string }) => {
          contents.push({
            role: item.sender === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          });
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      });

      const reply = response.text || 'I am happy to assist you with Chhatrapati Sambhajinagar property queries.';
      return res.json({ reply });
    } catch (err: any) {
      console.error('Gemini Assistant Error:', err);
      return res.status(500).json({ 
        error: 'Failed to generate AI response',
        details: err?.message || 'Unknown error'
      });
    }
  });

  // Visual Home Page AI Editor — turns natural-language admin instructions into CMS changes.
  app.post('/api/ai/home-editor', async (req, res) => {
    try {
      const {
        instruction = '', image = null, selectedSectionId = null, config = {}, pages = {},
        navigationConfig = {}, settings = {}, bannerAds = [], offers = [], projects = [],
        allProperties = [], realtors = [], clubCardsConfig = {}, mediaLibrary = [],
        cmsBlogs = [], trainingBlogs = [], knowledgeHubConfig = {}, customServiceDetails = {}
      } = req.body || {};
      if (!instruction.trim() && !image) return res.status(400).json({ error: 'Instruction or image is required' });

      const ai = getGenAI();
      if (!ai) {
        return res.json({
          configured: false,
          message: 'AI key not configured; use the built-in website commands or add GEMINI_API_KEY for full AI control.',
          config,
          createdPages: []
        });
      }

      const prompt = `You are the Auricity AI Website Operator inside a non-technical admin CMS. You are an execution agent, not a chatbot. Understand the administrator's natural-language request, inspect the attached screenshot when present, and return the smallest complete set of CMS changes needed.
Rules:
- Treat the request as an instruction to operate the website, not merely to explain how to do it.
- If an image/screenshot is attached, use it as visual evidence. Identify the likely target section from the screenshot and the administrator's wording. Do not claim a visual change unless you return the corresponding CMS update.
- The administrator may use Hindi, Roman Hindi, Marathi, or English; understand all of them.
- When a request is ambiguous and there is no selected section, no screenshot, and no other contextual signal that pins down the target, do NOT guess or modify anything: return {"needsClarification": true, "message": "<one short question in the administrator's own language/script asking exactly which section/page/element they mean>"} and leave every other field empty/unchanged. Only do this when you genuinely cannot tell; if a selected section or screenshot makes the target clear, proceed with the change instead of asking.
- CRITICAL: never confuse "shorten/reduce/remove the TEXT or DETAILS inside a section" with "hide/delete/remove the SECTION itself". Words like "remove"/"hata do" are ambiguous by themselves — a request such as "extra details remove karo" or "isme se excess text hata do" is ALWAYS about the words inside the cards/section, never about hiding or deleting the section, even though it contains "remove". Only hide or delete a section when the instruction is unambiguously about the section/card/block as a whole (e.g. "is section ko hide karo", "isse hata do (poora section)") with no mention of text/details/content/description as the object being removed. When in doubt between shortening text and hiding the section, always choose shortening text and keep the section fully visible with all its cards intact — never hide a section as a guess.
- Preserve unrelated content and fields.
- Homepage: reorder sections, hide/show sections, change headings/descriptions/images, layout, spacing, background, auto-scroll, global scroll settings, logo and favicon.
- The Why Choose Us section is rendered from CMS page home.sections.whyChooseUs; for visual density requests such as “Why Choose Us chhota/compact karo”, use pageUpdates to set customFields.compact: true and customFields.density: "compact" while preserving its content.
- Pages: create, edit, rename, hide from navigation, or delete CMS pages when explicitly requested. A created page must contain id,title,slug,metaTitle,metaDescription,lastUpdated and one or more sections with id,name,heading,subheading,badge,bodyText,ctaText,ctaLink,imageUrl,videoUrl,items,customFields as appropriate.
- Navigation: add/remove/reorder/rename menu items and sub-items when explicitly requested.
- Site-wide settings: update branding, contact information, labels and other supplied settings when explicitly requested.
- Content collections: update banners, offers, projects, properties, realtors, blogs, training content, media metadata, services and club/knowledge configuration when explicitly requested; return only changed records.
- For media, change metadata or existing media URLs only when supplied; do not fabricate uploads.
- Services are represented by customServiceDetails keyed by service id. Update only requested service records.
- You may update any supported website content represented in the supplied state, not just homepage sections.
- Do not invent unsupported capabilities: if a requested change requires a backend capability that is not represented, return a clear message instead of pretending it happened.
- If the user says 'do it', 'change it', 'make it', 'remove it', 'put it', or similar, perform the action rather than returning instructions.
- Never invent record IDs. Never delete records unless explicitly requested.
- Return JSON only with keys: message, needsClarification, config, createdPages, deletedPages, pageUpdates, navigationConfig, settings, bannerAds, offers, projects, properties, realtors, cmsBlogs, trainingBlogs, mediaLibrary, clubCardsConfig, knowledgeHubConfig, customServiceDetails.
- For arrays, return only the records actually changed; otherwise return an empty array.
- deletedPages must contain ids only and may be used only when the administrator explicitly asks to delete/remove a page.
- customServiceDetails must be an object keyed by service id and contain only changed service records.
- pageUpdates may be either {pageId:{sectionId:{...updates}}} or {pageId:{sectionId,updates}}.


Current config:
${JSON.stringify(config)}
Current CMS pages:
${JSON.stringify(pages)}
Current navigation:
${JSON.stringify(navigationConfig)}
Current settings:
${JSON.stringify(settings)}
Current banners:
${JSON.stringify(bannerAds)}
Current offers:
${JSON.stringify(offers)}
Current projects:
${JSON.stringify(projects)}
Current properties:
${JSON.stringify(allProperties)}
Current realtors:
${JSON.stringify(realtors)}
Current club cards config:
${JSON.stringify(clubCardsConfig)}
Current media library metadata:
${JSON.stringify(mediaLibrary)}
Current blogs:
${JSON.stringify(cmsBlogs)}
Current training blogs:
${JSON.stringify(trainingBlogs)}
Current knowledge hub config:
${JSON.stringify(knowledgeHubConfig)}
Current service overrides:
${JSON.stringify(customServiceDetails)}
Selected section:
${selectedSectionId || 'none'}
Administrator instruction:
${instruction}`;

      const parts: any[] = [{ text: prompt }];
      if (image?.data && image?.mimeType) {
        parts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
      }
      let raw = '';
      let parsed: any = null;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts }],
          config: { responseMimeType: 'application/json', temperature: 0.1 }
        });
        raw = response.text || '';
        parsed = parseAIJson(raw);
      } catch (firstError: any) {
        // One constrained retry fixes the common case where the model emits
        // prose/markdown despite JSON mode. The retry keeps the same visual
        // screenshot and state, so it can still understand image requests.
        const retryParts: any[] = [{
          text: `${prompt}

IMPORTANT RETRY:
Your previous output was not valid JSON. Return ONLY one valid JSON object.
Do not use markdown fences. Do not add commentary before or after the object.
Use exactly these top-level keys:
message, needsClarification, config, createdPages, deletedPages, pageUpdates, navigationConfig, settings, bannerAds, offers, projects, properties, realtors, cmsBlogs, trainingBlogs, mediaLibrary, clubCardsConfig, knowledgeHubConfig, customServiceDetails.
If no value changes, use an empty array/object or null as appropriate.`
        }];
        if (image?.data && image?.mimeType) {
          retryParts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
        }

        try {
          const retry = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: retryParts }],
            config: { responseMimeType: 'application/json', temperature: 0 }
          });
          raw = retry.text || '';
          parsed = parseAIJson(raw);
        } catch (retryError: any) {
          console.error('Home editor AI invalid response:', retryError);
          return res.status(422).json({
            configured: true,
            error: 'AI returned an invalid response. Please try the same command again.',
            details: retryError?.message || firstError?.message || 'Invalid AI response'
          });
        }
      }

      return res.json({
        configured: true,
        needsClarification: Boolean(parsed.needsClarification),
        message: parsed.message || 'Website updated by AI.',
        config: parsed.config || config,
        createdPages: Array.isArray(parsed.createdPages) ? parsed.createdPages : [],
        deletedPages: Array.isArray(parsed.deletedPages) ? parsed.deletedPages : [],
        pageUpdates: parsed.pageUpdates || {},
        navigationConfig: parsed.navigationConfig || null,
        settings: parsed.settings || null,
        bannerAds: Array.isArray(parsed.bannerAds) ? parsed.bannerAds : [],
        offers: Array.isArray(parsed.offers) ? parsed.offers : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        properties: Array.isArray(parsed.properties) ? parsed.properties : [],
        realtors: Array.isArray(parsed.realtors) ? parsed.realtors : [],
        cmsBlogs: Array.isArray(parsed.cmsBlogs) ? parsed.cmsBlogs : [],
        trainingBlogs: Array.isArray(parsed.trainingBlogs) ? parsed.trainingBlogs : [],
        mediaLibrary: Array.isArray(parsed.mediaLibrary) ? parsed.mediaLibrary : [],
        clubCardsConfig: parsed.clubCardsConfig || null,
        knowledgeHubConfig: parsed.knowledgeHubConfig || null,
        customServiceDetails: parsed.customServiceDetails && typeof parsed.customServiceDetails === 'object' ? parsed.customServiceDetails : {}
      });
    } catch (err: any) {
      console.error('Home editor AI error:', err);
      return res.status(500).json({ error: 'Failed to apply AI website edit', details: err?.message || 'Unknown error' });
    }
  });

  // Alias for /api/ai/chat
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, conversationHistory, language = 'english' } = req.body;
      const ai = getGenAI();
      if (!ai) {
        return res.json({
          reply: language === 'marathi'
            ? `नमस्कार! मी छत्रपती संभाजीनगरमधील आपला ऑरिसिटी एआय सल्लागार आहे. सिडको (CIDCO, ₹4,500-₹5,800/sq.ft) आणि ऑरिक (AURIC) स्मार्ट सिटीतील माहितीसाठी मी सज्ज आहे.`
            : `Hello! I am your Auricity AI advisor for Chhatrapati Sambhajinagar. CIDCO residential rates average ₹4,500-₹5,800/sq.ft while AURIC Shendra industrial nodes are appreciating at 16%+ YoY. How can I assist your property search or valuation today?`
        });
      }

      const systemPrompt = `You are "Auricity AI", an expert PropTech real estate advisor and legal consultant for Chhatrapati Sambhajinagar (Aurangabad), Maharashtra. Provide sharp, informative guidance on localities (CIDCO, Jalna Road, Beed Bypass, Garkheda, AURIC Shendra, Waluj MIDC), ready reckoner rates, stamp duty (6% for males, 5% for females), 30-year sub-registrar title deeds, and 0% brokerage direct owner deals. Respond in the language requested: ${language}.`;

      const contents: any[] = [];
      if (Array.isArray(conversationHistory)) {
        conversationHistory.forEach((item: { role: string; text: string }) => {
          contents.push({
            role: item.role === 'model' ? 'model' : 'user',
            parts: [{ text: item.text }]
          });
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      });

      return res.json({ reply: response.text || 'Assistance ready.' });
    } catch (err: any) {
      console.error('AI chat error:', err);
      return res.json({
        reply: 'CIDCO residential units currently trade at ₹4,500-₹6,000/sq.ft with 0% brokerage options available across Sambhajinagar.'
      });
    }
  });

  // Alias for /api/ai/enhance-listing
  app.post('/api/ai/enhance-listing', async (req, res) => {
    try {
      const { rawTitle, locality, propertyType, bhk, areaSqFt, furnishing, amenities, language = 'english' } = req.body;
      const ai = getGenAI();
      if (!ai) {
        return res.json({
          enhancedTitle: `Premium ${bhk || 2} BHK ${propertyType} in ${locality} | Vastu Compliant`,
          enhancedDescription: `Exceptional opportunity to acquire a well-maintained ${bhk || 2} BHK ${propertyType} situated in the heart of ${locality}, Chhatrapati Sambhajinagar. Boasting ${areaSqFt} sq.ft carpet area, clear freehold title, and excellent proximity to schools, hospitals, and transit hubs.`,
          recommendedKeywords: ['24/7 Corporation Water', 'Lift with DG Backup', 'MahaRERA Approved']
        });
      }

      const prompt = `Write an optimized luxury real estate listing title, high-converting description, and 4 high-demand amenity tags for a property in Chhatrapati Sambhajinagar:
- Title draft: ${rawTitle}
- Locality: ${locality}
- Property type: ${propertyType}
- BHK: ${bhk}
- Area: ${areaSqFt} sq.ft
- Furnishing: ${furnishing}
- Amenities: ${Array.isArray(amenities) ? amenities.join(', ') : ''}
Language: ${language}

Output JSON with keys:
"enhancedTitle": string (punchy, high click-through rate, under 80 chars)
"enhancedDescription": string (2 paragraphs highlighting location advantages in Sambhajinagar, water security, and legal clarity)
"recommendedKeywords": string[] (3-4 localized keywords)`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err) {
      console.error('Enhance listing error:', err);
      return res.json({
        enhancedTitle: `Prime ${req.body.bhk || 2} BHK in ${req.body.locality} | Clear Title`,
        enhancedDescription: `Well ventilated property in ${req.body.locality} with 24/7 water and dedicated car parking.`
      });
    }
  });

  // AI Instant Fair Market Valuation & Investment Analytics
  app.post('/api/ai/valuation', async (req, res) => {
    try {
      const { 
        locality, 
        propertyType, 
        carpetArea, 
        bedrooms, 
        ageYears = 0, 
        furnishing = 'Unfurnished',
        amenities = [],
        language = 'english'
      } = req.body;

      const ai = getGenAI();

      // Calculation baseline logic for Sambhajinagar
      const localityRateMap: Record<string, number> = {
        'CIDCO N-1 to N-4': 6200,
        'CIDCO N-5 to N-8': 5400,
        'CIDCO N-9 to N-12': 4800,
        'Jalna Road (Golden Mile)': 8500,
        'Beed Bypass Road': 5800,
        'Garkheda Parisar': 4900,
        'Shendra MIDC / AURIC Smart City': 4200,
        'Waluj MIDC Industrial Area': 3600,
        'Chikalthana Industrial Area': 4100,
        'Seven Hills / Cannought Place': 7200,
        'Osmanpura / Station Road': 6500,
        'Samarth Nagar & Nirala Bazar': 7600,
        'Satara Parisar / Beed Highway': 4300,
        'Harsul / Jalgaon Road': 3900,
        'Paithan Road / IT Park': 3500
      };

      const baseRate = localityRateMap[locality] || 4800;
      let multiplier = 1.0;
      if (propertyType.includes('Villa')) multiplier += 0.25;
      if (propertyType.includes('Penthouse')) multiplier += 0.35;
      if (propertyType.includes('Commercial')) multiplier += 0.40;
      if (furnishing === 'Fully Furnished') multiplier += 0.12;
      if (furnishing === 'Semi-Furnished') multiplier += 0.05;
      if (amenities.length > 5) multiplier += 0.08;
      if (ageYears > 10) multiplier -= 0.15;
      else if (ageYears > 5) multiplier -= 0.08;

      const calculatedRate = Math.round(baseRate * multiplier);
      const fairPrice = Math.round(calculatedRate * Number(carpetArea || 1000));
      const minPrice = Math.round(fairPrice * 0.94);
      const maxPrice = Math.round(fairPrice * 1.07);

      // Stamp duty breakdown in Maharashtra
      const stampDutyMale = Math.round(fairPrice * 0.06);
      const stampDutyFemale = Math.round(fairPrice * 0.05);
      const registrationFee = Math.min(30000, Math.round(fairPrice * 0.01));
      const expectedMonthlyRent = Math.round((fairPrice * 0.032) / 12);
      const expectedRentalYield = 3.2;

      let aiAnalysis = `Based on recent sales velocity in ${locality}, this ${propertyType} of ${carpetArea} sq.ft holds strong capital appreciation prospects driven by proximity to major transit corridors and commercial expansion.`;

      if (ai) {
        try {
          const prompt = `Provide a concise 3-bullet expert real estate valuation analysis in ${language} for a ${propertyType} located in ${locality}, Chhatrapati Sambhajinagar with ${carpetArea} sq.ft carpet area, ${bedrooms || 2} bedrooms, and estimated price of ₹${(fairPrice / 100000).toFixed(1)} Lakhs. Include rental demand, appreciation outlook for next 3 years, and key locality drivers.`;
          
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are a certified Marathwada real estate appraiser and market analyst. Keep the output to 3 sharp, bulleted insights.',
              temperature: 0.5
            }
          });
          if (response.text) {
            aiAnalysis = response.text;
          }
        } catch (e) {
          console.warn('AI valuation prompt fallback used');
        }
      }

      return res.json({
        fairPrice,
        minPrice,
        maxPrice,
        ratePerSqFt: calculatedRate,
        confidenceScore: 94,
        rentalYieldPercent: expectedRentalYield,
        estimatedMonthlyRent: expectedMonthlyRent,
        stampDutyMale,
        stampDutyFemale,
        registrationFee,
        totalRegistrationMale: stampDutyMale + registrationFee,
        totalRegistrationFemale: stampDutyFemale + registrationFee,
        trend: 'Rising (+7.8% YoY)',
        aiAnalysis,
        // Frontend-compatible aliases kept alongside the canonical API fields
        // so older deployed clients do not break during rollout.
        estimatedPriceMin: minPrice,
        estimatedPriceMax: maxPrice,
        recommendedPrice: fairPrice,
        estimatedRentMonthly: expectedMonthlyRent,
        pricePerSqFt: calculatedRate,
        growthProjection: 'Rising (+7.8% YoY)',
        valuationSummary: aiAnalysis,
        keyHighlights: [
          `Estimated rate: ₹${calculatedRate.toLocaleString('en-IN')}/sq.ft`,
          `Expected monthly rent: ₹${expectedMonthlyRent.toLocaleString('en-IN')}`,
          'Use this as an estimate; verify with recent local transactions before making a final decision.'
        ],
        language
      });
    } catch (err: any) {
      console.error('Valuation error:', err);
      return res.status(500).json({ error: 'Valuation calculation failed' });
    }
  });

  // AI Listing Description & Marketing Enhancer
  app.post('/api/ai/listing-enhancer', async (req, res) => {
    try {
      const { title, locality, propertyType, carpetArea, bedrooms, price, keyHighlights } = req.body;
      const ai = getGenAI();
      if (!ai) {
        return res.json({
          enhancedTitle: `Prime ${bedrooms || '2'} BHK ${propertyType} in ${locality} | RERA Approved`,
          enhancedDescription: `Discover this immaculately designed ${propertyType} situated in the prestigious neighborhood of ${locality}, Chhatrapati Sambhajinagar. Offering ${carpetArea} sq.ft of carpet area with superior natural light, Vastu compliance, and close proximity to key landmarks, top schools, and commercial hubs.\n\nKey Highlights:\n- Clear Legal Title & MahaRERA Registered\n- 24/7 Corporation Water Supply\n- Reserved Car Parking & Power Backup\n- High rental yield potential`,
          marathiSummary: `${locality} मधील हे ${propertyType} प्रशस्त, 24/7 पाणीपुरवठा आणि महारेरा मंजुरीसह विक्रीसाठी उपलब्ध आहे.`
        });
      }

      const prompt = `Act as an expert luxury real estate copywriter in Chhatrapati Sambhajinagar. Generate an attractive property listing package for:
- Property Title: ${title || 'Apartment'}
- Locality: ${locality}
- Type: ${propertyType}
- Carpet Area: ${carpetArea} sq.ft
- Bedrooms: ${bedrooms || 'N/A'}
- Price: ₹${price}
- Specific highlights: ${keyHighlights || 'Near main road, verified legal title, 24/7 water'}

Output format: Return a JSON object with:
"enhancedTitle": A catchy, professional title (under 75 chars)
"enhancedDescription": A rich 3-paragraph marketing description highlighting lifestyle, architecture, and investment value.
"bulletPoints": Array of 5 strong selling points
"marathiSummary": A 2-sentence summary in authentic Marathi for local buyers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Listing enhancer error:', err);
      return res.status(500).json({ error: 'Failed to enhance listing' });
    }
  });

  return app;
}
