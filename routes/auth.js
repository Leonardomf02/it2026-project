var express = require('express');
var bcrypt = require('bcrypt');
var db = require('../config/database');

var router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  var { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 characters.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  var duplicate = db.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).get(username.trim(), email.trim());

  if (duplicate) {
    return res.status(409).json({ error: 'Username or email already taken.' });
  }

  try {
    var hash = await bcrypt.hash(password, 10);
    db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username.trim(), email.trim(), hash);
    res.status(201).json({ message: 'Account created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  var { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }

  var user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'This account has been blocked.' });
  }

  try {
    var valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    };

    res.json({ user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out.' });
  });
});

// GET /api/auth/session
router.get('/session', (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
