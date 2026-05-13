var express = require('express');
var db = require('../config/database');
var { requireLogin } = require('../middleware/auth');

var router = express.Router();

// GET /api/ratings/:movieId - get average + user rating (public avg, user needs login)
router.get('/:movieId', (req, res) => {
  var movieId = Number(req.params.movieId);
  var avg = db.prepare(
    'SELECT AVG(score) as avg, COUNT(*) as count FROM ratings WHERE movie_id = ?'
  ).get(movieId);

  var result = {
    average: avg.avg ? Math.round(avg.avg * 10) / 10 : null,
    count: avg.count
  };

  if (req.session.user) {
    var mine = db.prepare(
      'SELECT score FROM ratings WHERE user_id = ? AND movie_id = ?'
    ).get(req.session.user.id, movieId);
    result.userRating = mine ? mine.score : null;
  }

  res.json(result);
});

// POST /api/ratings/:movieId
router.post('/:movieId', requireLogin, (req, res) => {
  var movieId = Number(req.params.movieId);
  var score = Number(req.body.score);

  if (isNaN(score) || score < 0 || score > 10 || !Number.isInteger(score)) {
    return res.status(400).json({ error: 'Score must be an integer from 0 to 10.' });
  }

  var exists = db.prepare('SELECT 1 FROM movies WHERE id = ?').get(movieId);
  if (!exists) return res.status(404).json({ error: 'Movie not found.' });

  try {
    db.prepare(
      'INSERT INTO ratings (user_id, movie_id, score) VALUES (?, ?, ?) ON CONFLICT(user_id, movie_id) DO UPDATE SET score = ?, created_at = datetime(\'now\')'
    ).run(req.session.user.id, movieId, score, score);
    res.json({ message: 'Rating saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/ratings/:movieId
router.delete('/:movieId', requireLogin, (req, res) => {
  var info = db.prepare('DELETE FROM ratings WHERE user_id = ? AND movie_id = ?').run(
    req.session.user.id, Number(req.params.movieId)
  );
  if (info.changes === 0) return res.status(404).json({ error: 'No rating found.' });
  res.json({ message: 'Rating removed.' });
});

module.exports = router;
