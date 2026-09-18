// Vercel serverless entry point for every /api/* request.
//
// Root cause this fixes: vercel.json previously only declared
// `"framework": "vite"`, which tells Vercel to build and serve this project
// as a plain static site. Vercel never executed server.ts at all — it isn't
// a supported "start a Node process and proxy to it" target — so every
// fetch('/api/...') from the frontend actually hit Vercel's own static
// hosting, found no matching file, and got back Vercel's default HTML 404
// page ("The page could not be found ..."). The AI Editor's client code
// then tried to JSON.parse that HTML and threw
// `Unexpected token 'T', "The page c"... is not valid JSON` — exactly the
// error reported. The same 404 silently broke /api/store (CMS persistence)
// and every other AI endpoint too.
//
// The fix has two halves:
//   1. This file, which exports the exact same Express app used for
//      traditional Node hosting as a Vercel Node serverless function.
//      It imports from ../server-app (NOT ../server) specifically because
//      server.ts pulls in 'vite' for local dev — bundling that into this
//      function caused a second bug, "This Serverless Function has
//      crashed" (FUNCTION_INVOCATION_FAILED). server-app.ts contains the
//      routes only, with zero reference to vite anywhere in its import
//      chain, so the function starts cleanly on Vercel.
//   2. vercel.json's `rewrites`, which sends every /api/* request to this
//      function (Vercel's default file-based routing would otherwise only
//      map this file to the single path /api/index).
import { createApp } from '../server-app';

const app = createApp();

export default app;
