import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { ensureIndexes } from './db/db.js';
import authRoutes from './routes/auth.route.js';
import { gameRoutes } from './routes/games.route.js';

const app = new Hono();
await ensureIndexes();
app.use(logger());

app.get('/api/health', (c) => {
    return c.json({ ok: true }, 200);
});

app.route('/api/auth', authRoutes);

app.route('/api/games', gameRoutes);

app.onError((err, c) => {
    if (err instanceof HTTPException) return c.json({ error: err.message || "Request failed" }, err.status);
    console.error(err);
    return c.json({ error: 'Internal Server Error' }, 500);
});

app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404);
});



// Render sets PORT; 3000 locally
serve(
    {
        fetch: app.fetch,
        port: Number(process.env.PORT) || 3000
    },

    (info) => {
        console.log(`Server listening on port ${info.port}`);
    }
)
