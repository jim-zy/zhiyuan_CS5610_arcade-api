import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/api/health', (c) => {
  return c.json({ ok: true }, 200);
});

// Render sets PORT; 3000 locally
serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000
});
