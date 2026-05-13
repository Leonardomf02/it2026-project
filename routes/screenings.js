var express = require('express');
var db = require('../config/database');
var { requireAdmin } = require('../middleware/auth');

var router = express.Router();

// GET /api/screenings - list with filters
// Query: movie_id, cinema_id, date (YYYY-MM-DD), from (YYYY-MM-DD), to (YYYY-MM-DD)
router.get('/', (req, res) => {
  var sql = `SELECT s.*, m.title AS movie_title, m.poster_url, c.name AS cinema_name, c.city AS cinema_city
             FROM screenings s
             JOIN movies m ON m.id = s.movie_id
             JOIN cinemas c ON c.id = s.cinema_id
             WHERE 1 = 1`;
  var params = [];

  if (req.query.movie_id) {
    sql += ' AND s.movie_id = ?';
    params.push(Number(req.query.movie_id));
  }
  if (req.query.cinema_id) {
    sql += ' AND s.cinema_id = ?';
    params.push(Number(req.query.cinema_id));
  }
  if (req.query.date) {
    sql += ' AND date(s.screening_time) = ?';
    params.push(req.query.date);
  }
  if (req.query.from) {
    sql += ' AND date(s.screening_time) >= ?';
    params.push(req.query.from);
  }
  if (req.query.to) {
    sql += ' AND date(s.screening_time) <= ?';
    params.push(req.query.to);
  }

  sql += ' ORDER BY s.screening_time ASC';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/screenings/:id
router.get('/:id', (req, res) => {
  var row = db.prepare(
    `SELECT s.*, m.title AS movie_title, c.name AS cinema_name
     FROM screenings s
     JOIN movies m ON m.id = s.movie_id
     JOIN cinemas c ON c.id = s.cinema_id
     WHERE s.id = ?`
  ).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Screening not found.' });
  res.json(row);
});

// POST /api/screenings (admin)
router.post('/', requireAdmin, (req, res) => {
  var { movie_id, cinema_id, screening_time, hall } = req.body;
  if (!movie_id || !cinema_id || !screening_time) {
    return res.status(400).json({ error: 'movie_id, cinema_id and screening_time are required.' });
  }

  var movie = db.prepare('SELECT 1 FROM movies WHERE id = ?').get(movie_id);
  if (!movie) return res.status(400).json({ error: 'Invalid movie_id.' });
  var cinema = db.prepare('SELECT 1 FROM cinemas WHERE id = ?').get(cinema_id);
  if (!cinema) return res.status(400).json({ error: 'Invalid cinema_id.' });

  var info = db.prepare(
    'INSERT INTO screenings (movie_id, cinema_id, screening_time, hall) VALUES (?, ?, ?, ?)'
  ).run(movie_id, cinema_id, screening_time, hall || null);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// PUT /api/screenings/:id (admin)
router.put('/:id', requireAdmin, (req, res) => {
  var { movie_id, cinema_id, screening_time, hall } = req.body;
  if (!movie_id || !cinema_id || !screening_time) {
    return res.status(400).json({ error: 'movie_id, cinema_id and screening_time are required.' });
  }

  var exists = db.prepare('SELECT 1 FROM screenings WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Screening not found.' });

  db.prepare(
    'UPDATE screenings SET movie_id = ?, cinema_id = ?, screening_time = ?, hall = ? WHERE id = ?'
  ).run(movie_id, cinema_id, screening_time, hall || null, req.params.id);
  res.json({ message: 'Screening updated.' });
});

// DELETE /api/screenings/:id (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  var info = db.prepare('DELETE FROM screenings WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Screening not found.' });
  res.json({ message: 'Screening deleted.' });
});

module.exports = router;
