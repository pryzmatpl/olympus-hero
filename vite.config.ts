import path from 'node:path';
import fs from 'node:fs';
import type { Connect } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Serves `/<project>/storage` at `/storage/*`, matching Express in server/index.js:
 * `app.use('/storage', express.static(path.join(process.cwd(), 'storage')))`
 * so Vite dev/preview resolve the same URLs as production (nginx → API or volume).
 */
function storageStaticMiddleware(): Connect.HandleFunction {
  const root = path.resolve(process.cwd(), 'storage');

  const mime: Record<string, string> = {
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  return (req, res, next) => {
    const rawUrl = req.url ?? '';
    if (!rawUrl.startsWith('/storage')) {
      next();
      return;
    }

    const pathname = decodeURIComponent(rawUrl.split('?')[0] ?? '');
    const unsafeRel = pathname.replace(/^\/storage\/?/, '').replace(/\\/g, '/');
    const filePath = path.resolve(root, unsafeRel);
    const relToRoot = path.relative(root, filePath);
    if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
      res.statusCode = 403;
      res.end();
      return;
    }

    fs.stat(filePath, (err, st) => {
      if (err || !st.isFile()) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', mime[ext] ?? 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    });
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-repo-storage',
      configureServer(server) {
        server.middlewares.use(storageStaticMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(storageStaticMiddleware());
      },
    },
  ],
});
