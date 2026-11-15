import { HTTPException } from 'hono/http-exception';
import { ObjectId } from 'mongodb';
import { BOARD_SIZE } from '@peacestay/arcade-core'

export async function readJson(c) {
    let body;
    try {
        body = await c.req.json();
    } catch (err) {
        throw new HTTPException(400, { message: 'Invalid JSON' });
    }

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        throw new HTTPException(400, { message: 'Body must be non-null JSON object' });
    }
    return body;
};

export function validateSignup(body) {
    let { email, username, password } = body;
    if (typeof email !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
        throw new HTTPException(400, { message: 'Invalid field types' });
    }

    email = email.trim().toLowerCase();
    username = username.trim();
    if (!email || !username || !password) {
        throw new HTTPException(400, { message: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HTTPException(400, { message: 'Invalid email format' });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        throw new HTTPException(400, { message: 'Invalid username format' });
    }
    if (password.length < 6) {
        throw new HTTPException(400, { message: 'Password must be at least 6 characters long' });
    }
    return { email, username, password };
};

export function validateLogin(body) {
    let { email, password } = body;
    if (typeof email !== 'string' || typeof password !== 'string') {
        throw new HTTPException(400, { message: 'Invalid field types' });
    }

    email = email.trim().toLowerCase();
    if (!email || !password) {
        throw new HTTPException(400, { message: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HTTPException(400, { message: 'Invalid email format' });
    }
    if (password.length < 6) {
        throw new HTTPException(400, { message: 'Password must be at least 6 characters long' });
    }
    return { email, password };
}

export function parseObjectId(id) {
    if (!ObjectId.isValid(id)) {
        throw new HTTPException(400, { message: 'Invalid ObjectId' });
    }
    return new ObjectId(id);
}

export function validateShot(board, shot) {
    const { x, y } = shot;
    if (Number.isInteger(x) === false || Number.isInteger(y) === false) {
        throw new HTTPException(400, { message: 'Invalid shot format' });
    }
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
        throw new HTTPException(400, { message: 'Invalid shot coordinates' });
    }
    if (board.shots.some(s => s.x === x && s.y === y)) {
        throw new HTTPException(409, { message: 'Shot already taken at this position' });
    }
    return { x, y };
}
