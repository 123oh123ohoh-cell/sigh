
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;
const SECRET = 'supersecretkey';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Root route for API status
app.get('/', (req, res) => {
  res.send('Welcome to the OwnsHub Backend API!');
});
// Follow a user
app.post('/api/follow', authenticateToken, (req, res) => {
  const follower = req.user.username;
  const { followee } = req.body;
  if (!followee || follower === followee) return res.status(400).json({ error: 'Invalid followee' });
  // Increment following for follower
  db.run('UPDATE profiles SET following = following + 1 WHERE username = ?', [follower], function(err) {
    if (err) return res.status(500).json({ error: 'DB error (following)' });
    // Increment followers for followee
    db.run('UPDATE profiles SET followers = followers + 1 WHERE username = ?', [followee], function(err2) {
      if (err2) return res.status(500).json({ error: 'DB error (followers)' });
      res.json({ success: true });
    });
  });
});

// Unfollow a user
app.post('/api/unfollow', authenticateToken, (req, res) => {
  const follower = req.user.username;
  const { followee } = req.body;
  if (!followee || follower === followee) return res.status(400).json({ error: 'Invalid followee' });
  // Decrement following for follower
  db.run('UPDATE profiles SET following = MAX(following - 1, 0) WHERE username = ?', [follower], function(err) {
    if (err) return res.status(500).json({ error: 'DB error (following)' });
    // Decrement followers for followee
    db.run('UPDATE profiles SET followers = MAX(followers - 1, 0) WHERE username = ?', [followee], function(err2) {
      if (err2) return res.status(500).json({ error: 'DB error (followers)' });
      res.json({ success: true });
    });
  });
});

// SQLite setup
const db = new sqlite3.Database('./ownshub.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    videoId INTEGER,
    username TEXT,
    text TEXT,
    date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS profiles (
    username TEXT PRIMARY KEY,
    displayName TEXT,
    pronouns TEXT,
    customPronouns TEXT,
    bio TEXT,
    avatar TEXT,
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0
  )`, (err) => {
    if (err) console.error('Error creating profiles table:', err);
  });

  // Migration: Add followers and following columns if missing
  db.run('ALTER TABLE profiles ADD COLUMN followers INTEGER DEFAULT 0', err => {
    if (err && !/duplicate column/.test(err.message)) console.error('Migration error (followers):', err.message);
  });
  db.run('ALTER TABLE profiles ADD COLUMN following INTEGER DEFAULT 0', err => {
    if (err && !/duplicate column/.test(err.message)) console.error('Migration error (following):', err.message);
  });

  // Arts table
  db.run(`CREATE TABLE IF NOT EXISTS arts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    image TEXT,
    title TEXT,
    description TEXT,
    date TEXT
  )`, (err) => {
    if (err) console.error('Error creating arts table:', err);
  });

  // Get all art posts
  app.get('/api/arts', (req, res) => {
    db.all('SELECT * FROM arts ORDER BY id DESC', (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    });
  });

  // Post new art (auth required)
  app.post('/api/arts', authenticateToken, (req, res) => {
    const username = req.user.username;
    const { image, title, description } = req.body;
    if (!image || !title) return res.status(400).json({ error: 'Missing fields' });
    const date = new Date().toLocaleString();
    db.run('INSERT INTO arts (username, image, title, description, date) VALUES (?, ?, ?, ?, ?)', [username, image, title, description, date], function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ id: this.lastID, username, image, title, description, date });
    });
  });
  db.run(`CREATE TABLE IF NOT EXISTS art_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    image TEXT,
    title TEXT,
    description TEXT,
    date TEXT
  )`, (err) => {
    if (err) console.error('Error creating art_posts table:', err);
  });
});
// Get all art posts
app.get('/api/art', (req, res) => {
  db.all('SELECT * FROM art_posts ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// Post new art (auth required)
app.post('/api/art', authenticateToken, (req, res) => {
  const username = req.user.username;
  const { image, title, description } = req.body;
  if (!image || !title) return res.status(400).json({ error: 'Missing fields' });
  const date = new Date().toLocaleString();
  db.run('INSERT INTO art_posts (username, image, title, description, date) VALUES (?, ?, ?, ?, ?)', [username, image, title, description, date], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ id: this.lastID, username, image, title, description, date });
  });
});
// Get profile (auth required for own, public for ?user=)
app.get('/api/profile', (req, res) => {
  const username = req.query.user;
  if (username) {
    // Public profile view
    db.get('SELECT displayName, pronouns, customPronouns, bio, avatar, followers, following FROM profiles WHERE username = ?', [username], (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(row || {});
    });
  } else {
    // Own profile (auth required)
    authenticateToken(req, res, () => {
      const user = req.user.username;
      db.get('SELECT displayName, pronouns, customPronouns, bio, avatar, followers, following FROM profiles WHERE username = ?', [user], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json(row || {});
      });
    });
  }
});

// Update profile (auth required)
app.post('/api/profile', authenticateToken, (req, res) => {
  const username = req.user.username;
  const { displayName, pronouns, customPronouns, bio, avatar, followers, following } = req.body;
  db.run(`INSERT INTO profiles (username, displayName, pronouns, customPronouns, bio, avatar, followers, following)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET displayName=excluded.displayName, pronouns=excluded.pronouns, customPronouns=excluded.customPronouns, bio=excluded.bio, avatar=excluded.avatar, followers=excluded.followers, following=excluded.following`,
    [username, displayName, pronouns, customPronouns, bio, avatar, followers || 0, following || 0],
    function(err) {
      if (err) {
        console.error('Profile save DB error:', err);
        return res.status(500).json({ error: 'DB error', details: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Helper: authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Register
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (row) return res.status(409).json({ error: 'Username exists' });
    const hash = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], function(err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      const token = jwt.sign({ username }, SECRET, { expiresIn: '7d' });
      res.json({ token, username });
    });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, row.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ username }, SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  });
});

// Post comment (auth required)
app.post('/api/comments', authenticateToken, (req, res) => {
  const { videoId, text } = req.body;
  const username = req.user.username;
  if (!videoId || !text) return res.status(400).json({ error: 'Missing fields' });
  const date = new Date().toLocaleString();
  db.run('INSERT INTO comments (videoId, username, text, date) VALUES (?, ?, ?, ?)', [videoId, username, text, date], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ id: this.lastID, videoId, username, text, date });
  });
});

// Get comments for a video
app.get('/api/comments/:videoId', (req, res) => {
  const videoId = req.params.videoId;
  db.all('SELECT * FROM comments WHERE videoId = ? ORDER BY id DESC', [videoId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
