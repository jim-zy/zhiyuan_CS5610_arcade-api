import { db } from '../db.js';

const sessions = db.collection('sessions');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export async function createSession(userId) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await sessions.insertOne({ _id: sessionId, userId, expiresAt });
    return sessionId;
}

export async function findSession(sessionId) {
    return await sessions.findOne({ _id: sessionId, expiresAt: { $gt: new Date() } });
}

export async function deleteSession(sessionId) {
    await sessions.deleteOne({ _id: sessionId });
}