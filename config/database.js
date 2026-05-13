const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const db = new Database(path.join(__dirname, '..', 'movies.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    release_date TEXT,
    genre TEXT,
    director TEXT,
    actors TEXT,
    description TEXT,
    poster_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cinemas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Kraków',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS screenings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    cinema_id INTEGER NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    screening_time TEXT NOT NULL,
    hall TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS favourites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, movie_id)
  );

  CREATE TABLE IF NOT EXISTS favourite_actors (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_name TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, actor_name)
  );

  CREATE TABLE IF NOT EXISTS favourite_cinemas (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cinema_id INTEGER NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, cinema_id)
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, movie_id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, movie_id)
  );
`);

var admin = db.prepare('SELECT 1 FROM users WHERE role = ?').get('admin');
if (!admin) {
  var hash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    "INSERT INTO users (username, email, password_hash, role) VALUES ('admin', 'admin@moviedb.local', ?, 'admin')"
  ).run(hash);
}

// keep screenings always "now playing": if every screening is in the past,
// shift them all forward so the earliest one falls on today.
var future = db.prepare("SELECT COUNT(*) as n FROM screenings WHERE screening_time >= datetime('now')").get().n;
if (future === 0) {
  var first = db.prepare("SELECT MIN(date(screening_time)) as d FROM screenings").get().d;
  if (first) {
    var firstDate = new Date(first + 'T00:00:00');
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diffDays = Math.round((today - firstDate) / 86400000);
    if (diffDays > 0) {
      db.prepare("UPDATE screenings SET screening_time = datetime(screening_time, ?)")
        .run('+' + diffDays + ' days');
      console.log('Shifted screenings forward by ' + diffDays + ' days.');
    }
  }
}

module.exports = db;
