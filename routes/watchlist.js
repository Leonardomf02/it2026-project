var express = require('express');
var db = require('../config/database');
var { requireLogin } = require('../middleware/auth');

var router = express.Router();

router.use(requireLogin);

// GET /api/watchlist
router.get('/', (req, res) => {
  var rows = db.prepare(
    'SELECT m.* FROM watchlist w JOIN movies m ON m.id = w.movie_id WHERE w.user_id = ? ORDER BY w.added_at DESC'
  ).all(req.session.user.id);
  res.json(rows);
});

// POST /api/watchlist/:movieId
router.post('/:movieId', (req, res) => {
  var movieId = Number(req.params.movieId);
  var exists = db.prepare('SELECT 1 FROM movies WHERE id = ?').get(movieId);
  if (!exists) return res.status(404).json({ error: 'Movie not found.' });

  try {
    db.prepare('INSERT OR IGNORE INTO watchlist (user_id, movie_id) VALUES (?, ?)').run(
      req.session.user.id, movieId
    );
    res.json({ message: 'Added to watchlist.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/watchlist/:movieId
router.delete('/:movieId', (req, res) => {
  var info = db.prepare('DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?').run(
    req.session.user.id, Number(req.params.movieId)
  );
  if (info.changes === 0) return res.status(404).json({ error: 'Not in watchlist.' });
  res.json({ message: 'Removed from watchlist.' });
});

module.exports = router;
