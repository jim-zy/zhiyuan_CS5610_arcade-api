import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { ensureIndexes } from './db/db.js';

const app = new Hono();
await ensureIndexes();

app.get('/api/health', (c) => {
  return c.json({ ok: true }, 200);
});

// Render sets PORT; 3000 locally
serve(
    {
        fetch: app.fetch,
        port: Number(process.env.PORT) || 3000
    },

    (info) => {
        console.log(`Server running on http://localhost:${info.port}`);
    }
)
