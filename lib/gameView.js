import { getSunkShips } from '@peacestay/arcade-core';

export function getGameView(game, viewerId) {
    // logged out view or non-player id only game is finished
    // stop unfinished games from upper routes
    if (!viewerId || !isPlayerInGame(game, viewerId)) {
        return loggedOutView(game);
    }
    const isYou = game.players[0].userid?.equals(viewerId);
    const isYourTurn = game.turn?.equals(viewerId);
    return {
        id: game._id.toString(),
        status: game.status,
        players: [
            {
                username: game.players[0].username,
                isYou: isYou,
                board: getBoardView(game.players[0].board, isYou)
            },
            {
                username: game.players[1].username,
                isYou: !isYou,
                board: getBoardView(game.players[1].board, !isYou)
            }
        ],
        turn: isYourTurn === true,
        winner: getWinnerName(game),
        createdAt: game.createdAt,
    };
}

export function isPlayerInGame(game, userId) {
    return game.players.some(p => p.userid?.equals(userId));
}

function getBoardView(board, isYou) {
    if (isYou) {
        return board;
    } else {
        return {...board, ships: getSunkShips(board)};
    }
}

function getWinnerName(game) {
    if (!game.winner) return null;
    const winner = game.players.find(p => p.userid?.equals(game.winner));
    return winner.username;
}

function loggedOutView(game) {
    return {
        id: game._id.toString(),
        status: game.status,
        players: [
            {
                username: game.players[0].username,
                board: game.players[0].board
            },
            {
                username: game.players[1].username,
                board: game.players[1].board
            }
        ],
        winner: getWinnerName(game),
        createdAt: game.createdAt
    };
}