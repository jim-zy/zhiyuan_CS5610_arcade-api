import { Hono } from 'hono';
import { updateBoard, isShipSunk, isGameComplete } from '@peacestay/arcade-core'
import { requireUser, getUserId } from '../lib/auth.js';
import { createGame, listGames, findGameById, joinGame, saveShot } from '../db/models/games.model.js';
import { getGameView, isPlayerInGame } from '../lib/gameView.js';
import { parseObjectId, validateShot, readJson } from '../lib/validate.js';
import { HTTPException } from 'hono/http-exception';

const gameRoutes = new Hono();

gameRoutes.post('/', requireUser, async (c) => {
    const user = c.get('user');
    const gameId = await createGame(user);
    c.header('Location', `/api/games/${gameId}`);
    return c.json({ id: gameId.toHexString() }, 201);
});

gameRoutes.get('/', requireUser, async (c) => {
    const user = c.get('user');
    const games = await listGames(user._id);
    const waitingGames = games.filter(g => g.status === 'waiting' && !isPlayerInGame(g, user._id));
    const myGames = games.filter(g => isPlayerInGame(g, user._id));
    return c.json({
        waiting: waitingGames.map(toSummary),
        mine: myGames.map(toSummary),
    }, 200);
});

gameRoutes.get('/:id', async (c) => {
    const userId = await getUserId(c);
    const gameId = parseObjectId(c.req.param('id'));
    const game = await findGameById(gameId);
    if (!game) {
        throw new HTTPException(404, { message: 'Game not found' });
    }
    if (game.status !== 'finished') {
        if (!userId) throw new HTTPException(401, { message: 'Not logged in' });
        if (!isPlayerInGame(game, userId)) {
            throw new HTTPException(403, { message: 'You are not a player in this game' });
        }
    }
    return c.json(getGameView(game, userId), 200);
});

gameRoutes.post('/:id/players', requireUser, async (c) => {
    const user = c.get('user');
    const gameId = parseObjectId(c.req.param('id'));
    await joinGame(gameId, user);
    return c.json({ id: gameId.toHexString() }, 200);
});

gameRoutes.post('/:id/shots', requireUser, async (c) => {
    const user = c.get('user');
    const gameId = parseObjectId(c.req.param('id'));
    const game = await findGameById(gameId);
    if (!game) {
        throw new HTTPException(404, { message: 'Game not found' });
    }
    if (!isPlayerInGame(game, user._id)) {
        throw new HTTPException(403, { message: 'You are not a player in this game' });
    }
    if (game.status !== 'active') {
        throw new HTTPException(409, { message: 'Game is not active' });
    }
    if (!game.turn.equals(user._id)) {
        throw new HTTPException(409, { message: 'Not your turn' });
    }
    const opponentIndex = game.players.findIndex(p => !p.userid.equals(user._id));
    const opponentBoard = game.players[opponentIndex].board;
    const opponentId = game.players[opponentIndex].userid;
    const {x, y} = validateShot(opponentBoard, await readJson(c));

    const newBoard = updateBoard(opponentBoard, x, y);
    const isHit = newBoard.shots.at(-1).hit;
    const hitShip = isHit ? newBoard.ships.find(s => s.cells.some(pos => pos.x === x && pos.y === y)) : null;
    const isGameOver = isGameComplete(newBoard);
    const result = {
        hit: isHit,
        sunk: hitShip && isShipSunk(hitShip, newBoard.shots) ? hitShip.name : null,
        gameOver: isGameOver
    };
    await saveShot(gameId, user._id, opponentIndex, opponentId, newBoard, isGameOver);
    return c.json(result, 201);
});




function toSummary(game) {
    return {
        id: game._id.toHexString(),
        status: game.status,
        players: game.players.map(p => p.username),
        createdAt: game.createdAt
    };
}

export { gameRoutes };