var express = require('express');
var db = require('../config/database');
var { requireLogin } = require('../middleware/auth');

var router = express.Router();

router.use(requireLogin);

// ---- Favourite actors ----
// (defined before :movieId routes so they take precedence)

// GET /api/favourites/actors
router.get('/actors', (req, res) => {
  var rows = db.prepare(
    'SELECT actor_name FROM favourite_actors WHERE user_id = ? ORDER BY actor_name ASC'
  ).all(req.session.user.id);
  res.json(rows.map(r => r.actor_name));
});

// GET /api/favourites/actors/movies - movies starring any favourite actor
router.get('/actors/movies', (req, res) => {
  var actors = db.prepare(
    'SELECT actor_name FROM favourite_actors WHERE user_id = ?'
  ).all(req.session.user.id).map(r => r.actor_name);

  if (actors.length === 0) return res.json([]);

  var sql = 'SELECT * FROM movies WHERE ' + actors.map(() => 'actors LIKE ?').join(' OR ');
  var params = actors.map(a => '%' + a + '%');
  res.json(db.prepare(sql).all(...params));
});

// POST /api/favourites/actors  body: { actor_name }
router.post('/actors', (req, res) => {
  var name = (req.body.actor_name || '').trim();
  if (!name) return res.status(400).json({ error: 'actor_name is required.' });

  db.prepare('INSERT OR IGNORE INTO favourite_actors (user_id, actor_name) VALUES (?, ?)').run(
    req.session.user.id, name
  );
  res.json({ message: 'Actor added to favourites.' });
});

// DELETE /api/favourites/actors  body: { actor_name }
router.delete('/actors', (req, res) => {
  var name = (req.body.actor_name || '').trim();
  if (!name) return res.status(400).json({ error: 'actor_name is required.' });

  var info = db.prepare('DELETE FROM favourite_actors WHERE user_id = ? AND actor_name = ?').run(
    req.session.user.id, name
  );
  if (info.changes === 0) return res.status(404).json({ error: 'Not in favourites.' });
  res.json({ message: 'Actor removed.' });
});

// ---- Favourite cinemas ----

// GET /api/favourites/cinemas
router.get('/cinemas', (req, res) => {
  var rows = db.prepare(
    `SELECT c.* FROM favourite_cinemas fc
     JOIN cinemas c ON c.id = fc.cinema_id
     WHERE fc.user_id = ? ORDER BY c.name ASC`
  ).all(req.session.user.id);
  res.json(rows);
});

// GET /api/favourites/cinemas/screenings - upcoming screenings at favourite cinemas
router.get('/cinemas/screenings', (req, res) => {
  var rows = db.prepare(
    `SELECT s.*, m.title AS movie_title, m.poster_url, c.name AS cinema_name
     FROM favourite_cinemas fc
     JOIN screenings s ON s.cinema_id = fc.cinema_id
     JOIN movies m ON m.id = s.movie_id
     JOIN cinemas c ON c.id = s.cinema_id
     WHERE fc.user_id = ? AND s.screening_time >= datetime('now')
     ORDER BY s.screening_time ASC`
  ).all(req.session.user.id);
  res.json(rows);
});

// POST /api/favourites/cinemas/:id
router.post('/cinemas/:id', (req, res) => {
  var id = Number(req.params.id);
  var exists = db.prepare('SELECT 1 FROM cinemas WHERE id = ?').get(id);
  if (!exists) return res.status(404).json({ error: 'Cinema not found.' });

  db.prepare('INSERT OR IGNORE INTO favourite_cinemas (user_id, cinema_id) VALUES (?, ?)').run(
    req.session.user.id, id
  );
  res.json({ message: 'Cinema added to favourites.' });
});

// DELETE /api/favourites/cinemas/:id
router.delete('/cinemas/:id', (req, res) => {
  var info = db.prepare('DELETE FROM favourite_cinemas WHERE user_id = ? AND cinema_id = ?').run(
    req.session.user.id, Number(req.params.id)
  );
  if (info.changes === 0) return res.status(404).json({ error: 'Not in favourites.' });
  res.json({ message: 'Cinema removed.' });
});

// ---- Favourite movies ----

// GET /api/favourites
router.get('/', (req, res) => {
  var rows = db.prepare(
    'SELECT m.* FROM favourites f JOIN movies m ON m.id = f.movie_id WHERE f.user_id = ? ORDER BY f.added_at DESC'
  ).all(req.session.user.id);
  res.json(rows);
});

// POST /api/favourites/:movieId
router.post('/:movieId', (req, res) => {
  var movieId = Number(req.params.movieId);
  if (!movieId) return res.status(400).json({ error: 'Invalid movie id.' });

  var exists = db.prepare('SELECT 1 FROM movies WHERE id = ?').get(movieId);
  if (!exists) return res.status(404).json({ error: 'Movie not found.' });

  db.prepare('INSERT OR IGNORE INTO favourites (user_id, movie_id) VALUES (?, ?)').run(
    req.session.user.id, movieId
  );
  res.json({ message: 'Added to favourites.' });
});

// DELETE /api/favourites/:movieId
router.delete('/:movieId', (req, res) => {
  var movieId = Number(req.params.movieId);
  if (!movieId) return res.status(400).json({ error: 'Invalid movie id.' });

  var info = db.prepare('DELETE FROM favourites WHERE user_id = ? AND movie_id = ?').run(
    req.session.user.id, movieId
  );
  if (info.changes === 0) return res.status(404).json({ error: 'Not in favourites.' });
  res.json({ message: 'Removed from favourites.' });
});

module.exports = router;
