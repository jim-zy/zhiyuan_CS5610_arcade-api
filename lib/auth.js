import bcrypt from 'bcrypt';
import { findSession } from '../db/models/sessions.model.js';
import { findUserById } from '../db/models/users.model.js';
import { HTTPException } from 'hono/http-exception';

export function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(pwd, hash) {
    return await bcrypt.compare(pwd, hash);
}

export function getSessionId(c) {
    const header = c.req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
        return null;
    }
    return header.replace('Bearer ', '');
}

export async function getUserId(c) {
    const sessionId = getSessionId(c);
    if (!sessionId) return null;
    const session = await findSession(sessionId);
    return session ? session.userId : null;
}

export async function requireUser(c ,next) {
    const sessionId = getSessionId(c);
    if (!sessionId) {
        throw new HTTPException(401, { message: 'Not logged in' });
    }
    const session = await findSession(sessionId);
    if (!session) {
        throw new HTTPException(401, { message: 'Invalid or expired session' });
    }
    
    const user = await findUserById(session.userId);
    if (!user) {
        throw new HTTPException(401, { message: 'User not found' });
    }
    c.set('user', user);
    c.set('sessionId', sessionId);
    await next();

}