var express = require('express');
var db = require('../config/database');
var { requireAdmin } = require('../middleware/auth');

var router = express.Router();

var SORTABLE_COLS = ['title', 'release_date', 'created_at', 'genre', 'director'];

// GET /api/movies - list with search/filter
router.get('/', (req, res) => {
  var sql = 'SELECT DISTINCT m.* FROM movies m';
  var where = ' WHERE 1 = 1';
  var params = [];

  var needsScreeningJoin = req.query.cinema_id || req.query.screening_date || req.query.now_playing === '1';
  if (needsScreeningJoin) {
    sql += ' JOIN screenings s ON s.movie_id = m.id';
    if (req.query.cinema_id) {
      where += ' AND s.cinema_id = ?';
      params.push(Number(req.query.cinema_id));
    }
    if (req.query.screening_date) {
      where += ' AND date(s.screening_time) = ?';
      params.push(req.query.screening_date);
    }
    if (req.query.now_playing === '1') {
      where += " AND s.screening_time >= datetime('now')";
    }
  }

  if (req.query.title) {
    where += ' AND m.title LIKE ?';
    params.push('%' + req.query.title + '%');
  }
  if (req.query.genre) {
    where += ' AND m.genre LIKE ?';
    params.push('%' + req.query.genre + '%');
  }
  if (req.query.director) {
    where += ' AND m.director LIKE ?';
    params.push('%' + req.query.director + '%');
  }
  if (req.query.actor) {
    where += ' AND m.actors LIKE ?';
    params.push('%' + req.query.actor + '%');
  }
  if (req.query.release_date) {
    where += ' AND m.release_date = ?';
    params.push(req.query.release_date);
  }
  if (req.query.release_from) {
    where += ' AND m.release_date >= ?';
    params.push(req.query.release_from);
  }
  if (req.query.release_to) {
    where += ' AND m.release_date <= ?';
    params.push(req.query.release_to);
  }

  var col = SORTABLE_COLS.includes(req.query.sort) ? req.query.sort : 'created_at';
  var order = req.query.order === 'asc' ? 'ASC' : 'DESC';
  sql += where + ' ORDER BY m.' + col + ' ' + order;

  res.json(db.prepare(sql).all(...params));
});

// GET /api/movies/genres - distinct genre list for dropdown
router.get('/genres', (req, res) => {
  var rows = db.prepare(
    'SELECT DISTINCT genre FROM movies WHERE genre IS NOT NULL ORDER BY genre'
  ).all();
  res.json(rows.map(r => r.genre));
});

// GET /api/movies/:id
router.get('/:id', (req, res) => {
  var movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Movie not found.' });
  res.json(movie);
});

// GET /api/movies/:id/screenings - upcoming screenings of a movie
router.get('/:id/screenings', (req, res) => {
  var rows = db.prepare(
    `SELECT s.*, c.name AS cinema_name, c.address AS cinema_address, c.city AS cinema_city
     FROM screenings s
     JOIN cinemas c ON c.id = s.cinema_id
     WHERE s.movie_id = ? AND s.screening_time >= datetime('now')
     ORDER BY s.screening_time ASC`
  ).all(req.params.id);
  res.json(rows);
});

// POST /api/movies (admin)
router.post('/', requireAdmin, (req, res) => {
  var { title, release_date, genre, director, actors, description, poster_url } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  var info = db.prepare(
    'INSERT INTO movies (title, release_date, genre, director, actors, description, poster_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    title.trim(),
    release_date || null,
    genre || null,
    director || null,
    actors || null,
    description || null,
    poster_url || null
  );
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// PUT /api/movies/:id (admin)
router.put('/:id', requireAdmin, (req, res) => {
  var { title, release_date, genre, director, actors, description, poster_url } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  var exists = db.prepare('SELECT 1 FROM movies WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Movie not found.' });

  db.prepare(
    'UPDATE movies SET title = ?, release_date = ?, genre = ?, director = ?, actors = ?, description = ?, poster_url = ? WHERE id = ?'
  ).run(
    title.trim(),
    release_date || null,
    genre || null,
    director || null,
    actors || null,
    description || null,
    poster_url || null,
    req.params.id
  );
  res.json({ message: 'Movie updated.' });
});

// DELETE /api/movies/:id (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  var info = db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Movie not found.' });
  res.json({ message: 'Movie deleted.' });
});

module.exports = router;
