const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const PORT = 3001;
const db = new Database(path.join(__dirname, 'game.db'));

db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    treasure_found INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), candidate);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

const app = express();
app.use(express.json());

// Attaches req.user when a valid Bearer token is provided
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const row = token
    ? db.prepare(
        `SELECT users.id, users.username FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token = ?`
      ).get(token)
    : undefined;
  if (!row) return res.status(401).json({ error: 'Not signed in' });
  req.user = row;
  req.token = token;
  next();
}

app.post('/api/signup', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscore)' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const result = db
      .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .run(username, hashPassword(password));
    const token = createSession(result.lastInsertRowid);
    res.json({ token, user: { id: result.lastInsertRowid, username } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw err;
  }
});

app.post('/api/signin', (req, res) => {
  const { username, password } = req.body || {};
  const user = typeof username === 'string'
    ? db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    : undefined;
  if (!user || typeof password !== 'string' || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = createSession(user.id);
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/signout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/scores', requireAuth, (req, res) => {
  const { score, treasureFound } = req.body || {};
  if (!Number.isInteger(score)) {
    return res.status(400).json({ error: 'score must be an integer' });
  }
  db.prepare('INSERT INTO scores (user_id, score, treasure_found) VALUES (?, ?, ?)')
    .run(req.user.id, score, treasureFound ? 1 : 0);
  res.json({ ok: true });
});

app.get('/api/scores', requireAuth, (req, res) => {
  const stats = db.prepare(
    `SELECT COUNT(*) AS gamesPlayed,
            COALESCE(SUM(score), 0) AS totalScore,
            COALESCE(MAX(score), 0) AS bestScore
     FROM scores WHERE user_id = ?`
  ).get(req.user.id);
  const recent = db.prepare(
    `SELECT score, treasure_found AS treasureFound, created_at AS createdAt
     FROM scores WHERE user_id = ?
     ORDER BY id DESC LIMIT 10`
  ).all(req.user.id);
  res.json({ stats, recent });
});

app.listen(PORT, () => {
  console.log(`Game API server running at http://localhost:${PORT}`);
});
