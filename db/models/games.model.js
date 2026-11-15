import { db } from '../db.js';
import { createRandomBoard } from '@peacestay/arcade-core';
import { HTTPException } from 'hono/http-exception';

const games = db.collection('games');

export async function createGame(user) {
    // status: 'waiting' | 'active' | 'finished'
    const result = await games.insertOne({
        status: 'waiting',
        players: [
            { userid: user._id, username: user.username, board: createRandomBoard() },
            { userid: null, username: null, board: createRandomBoard() }
        ],
        turn: null,
        winner: null,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return result.insertedId;
}

export async function findGameById(id) {
    return await games.findOne({ _id: id });
}

// list games that are either waiting or the user is a player
export async function listGames(userId) {
    return await games.find({
        $or: [
            { status: 'waiting' },
            { 'players.userid': userId }
        ]
    }, { projection: { 'players.board': 0 } }).toArray();
}

export async function joinGame(id, user) {
    const existingGame = await findGameById(id);
    if (!existingGame) throw new HTTPException(404, { message: 'Game not found' });
    if (existingGame.status !== 'waiting') throw new HTTPException(409, { message: 'Game is not joinable' });
    if (existingGame.players[0].userid.equals(user._id)) throw new HTTPException(409, { message: 'Cannot join your own game' });
    
    const filter = { 
        _id: id, 
        status: 'waiting', 
        'players.1.userid': null,
        'players.0.userid': { $ne: user._id } }; // Ensure the user is not already in the game

    const $set = {
        'players.1.userid': user._id,
        'players.1.username': user.username,
        'turn': existingGame.players[0].userid, // Set the turn to the first player
        'status': 'active',
        updatedAt: new Date()
    };

    const result = await games.updateOne(filter, { $set });
    if (result.modifiedCount === 0) {
        throw new HTTPException(409, { message: 'Game already joined' });
    }
}

export async function saveShot(id, userid, opponentIndex, opponentId, newBoard, isGameOver) {
    const filter = { _id: id, status: 'active', turn: userid };
    const $set = {
        [`players.${opponentIndex}.board`]: newBoard,
        turn: isGameOver ? null : opponentId,
        status: isGameOver ? 'finished' : 'active',
        winner: isGameOver ? userid : null,
        updatedAt: new Date()
    };
    const result = await games.updateOne(filter, { $set });
    if (result.modifiedCount === 0) {
        throw new HTTPException(409, { message: 'Failed to save shot' });
    }
}