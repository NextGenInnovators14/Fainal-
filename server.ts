import { createApp } from './server-app';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import express from 'express';

// Traditional Node hosting entry point (Render, Railway, a VPS, Docker,
// `npm start` locally, etc.) — builds the app above, then also serves the
// built frontend and listens on a port. Not used on Vercel: Vercel serves
// dist/ itself and calls api/index.ts directly per-request instead.
async function startServer() {
  const app = createApp();
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auricity Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
