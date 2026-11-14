import { Hono } from 'hono';
import { readJson, validateSignup, validateLogin } from '../lib/validate.js';
import { createUser, findUserByEmail, toPublicUser } from '../db/models/users.model.js';
import { hashPassword, verifyPassword, requireUser } from '../lib/auth.js';
import { createSession, deleteSession } from '../db/models/sessions.model.js';
import { HTTPException } from 'hono/http-exception';

const auth = new Hono();

auth.post('/signup', async (c) => {
    const body = await readJson(c);
    const { email, username, password } = validateSignup(body);
    const passwordHash = await hashPassword(password);
    
    let user;
    try {
        user = await createUser({ email, username, passwordHash });
    } catch (err) {
        if (err.code === 11000) {
            throw new HTTPException(
                409, err.keyPattern.email ? { message: 'Email already exists' } : { message: 'Username already exists' }
            );
        }
        throw err;
    }

    return c.json({ user }, 201);
});

auth.post('/login', async (c) => {
    const body = await readJson(c);
    const { email, password } = validateLogin(body);
    const user = await findUserByEmail(email);

    if (!user) {
        throw new HTTPException(401, { message: 'Invalid credentials' });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
        throw new HTTPException(401, { message: 'Invalid credentials' });
    }

    const sessionId = await createSession(user._id);


    return c.json({ sessionId, user: toPublicUser(user)}, 200);
});

auth.get('/me', requireUser, (c) => {
    return c.json({ user: toPublicUser(c.get('user')) }, 200);
});

auth.post('/logout', requireUser, async (c) => {
    const sessionId = c.get('sessionId');
    await deleteSession(sessionId);
    return c.json({ message: 'Logged out successfully' }, 200);
});

export default auth;
