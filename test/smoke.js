const BASE = process.env.API_URL ?? 'http://localhost:3000';

async function api(method, path, token, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data };
}

function check(label, actual, expected) {
    if (actual !== expected) {
        console.error(`❌ ${label}: expected ${expected}, got ${actual}`);
    } else {
        console.log(`✅ ${label}`);
    }
}

async function runTests() {
    const stamp = Date.now();
    const emailA = `a${stamp}@example.com`;
    const emailB = `b${stamp}@example.com`;
    const usernameA = `userA${stamp}`;
    const usernameB = `userB${stamp}`;
    // Test signup
    let response = await api('POST', '/api/auth/signup', null, { 
        email: emailA,
        username: usernameA,
        password: 'password123'
    });
    check('Signup status', response.status, 201);
    check('Signup data', response.data.user.email, emailA);
    check('Signup data', response.data.user.username, usernameA);

    // Test login
    response = await api('POST', '/api/auth/login', null, { 
        email: emailA,
        password: 'password123'
    });
    check('Login status', response.status, 200);
    check('Login data', response.data.user.email, emailA);
    check('Login data', response.data.user.username, usernameA);

    // test create game
    const token = response.data.sessionId;
    response = await api('POST', '/api/games', token);

    check('Create game status', response.status, 201);
    check('Create game data', response.data.id !== undefined, true);

    const gameId = response.data.id;

    // test list games
    response = await api('GET', '/api/games', token);
    check('List games status', response.status, 200);
    check('List shows my games', response.data.mine.some(g => g.id === gameId), true);

    // test get game by ID
    response = await api('GET', `/api/games/${gameId}`, token);
    check('Get game by ID status', response.status, 200);
    check('Get game by ID data id', response.data.id, gameId);

    // test join game, signup another user first
    response = await api('POST', '/api/auth/signup', null, { 
        email: emailB,
        username: usernameB,
        password: 'password123'
    });
    check('Signup status', response.status, 201);
    check('Signup data', response.data.user.email, emailB);
    check('Signup data', response.data.user.username, usernameB);
    response = await api('POST', '/api/auth/login', null, {
        email: emailB,
        password: 'password123'
    });
    const anotherToken = response.data.sessionId;
    response = await api('POST', `/api/games/${gameId}/players`, anotherToken);
    check('Join game status', response.status, 200);
    check('Join game data id', response.data.id, gameId);

}

runTests().catch(err => {
    console.error('Error running tests:', err);
});