import { db } from '../db.js';

const users = db.collection('users');

export async function createUser({ email, username, passwordHash }) {
    const result = await users.insertOne({ email, username, passwordHash, createdAt: new Date() });
    return toPublicUser({_id: result.insertedId, email, username });
}

// needs the password hash for login match
export async function findUserByEmail(email) {
    return await users.findOne({ email });
}

export async function findUserById(id) {
    return await users.findOne({ _id: id }, { projection: { passwordHash: 0 } });
}

export function toPublicUser(doc) {
    if (!doc) return null;
    return {
        id: doc._id.toHexString(),
        email: doc.email,
        username: doc.username
    };
}