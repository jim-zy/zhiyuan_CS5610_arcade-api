import {MongoClient} from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not set');
}
const client = new MongoClient(uri);

await client.connect();

export const db = client.db('arcade');

export async function ensureIndexes() {
    await db.collection('users').createIndexes([
        {
            key: { email: 1 },
            unique: true
        },
        {
            key: { username: 1 },
            unique: true
        }
        ]);
  
    await db.collection('sessions').createIndexes([
        {
        key: { expiresAt: 1 },
        expireAfterSeconds: 0
        }
    ]);
}