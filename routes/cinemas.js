var express = require('express');
var db = require('../config/database');
var { requireAdmin } = require('../middleware/auth');

var router = express.Router();

// GET /api/cinemas
router.get('/', (req, res) => {
  var sql = 'SELECT * FROM cinemas WHERE 1 = 1';
  var params = [];

  if (req.query.name) {
    sql += ' AND name LIKE ?';
    params.push('%' + req.query.name + '%');
  }
  if (req.query.city) {
    sql += ' AND city LIKE ?';
    params.push('%' + req.query.city + '%');
  }

  sql += ' ORDER BY name ASC';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/cinemas/:id
router.get('/:id', (req, res) => {
  var cinema = db.prepare('SELECT * FROM cinemas WHERE id = ?').get(req.params.id);
  if (!cinema) return res.status(404).json({ error: 'Cinema not found.' });
  res.json(cinema);
});

// POST /api/cinemas (admin)
router.post('/', requireAdmin, (req, res) => {
  var { name, address, city } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  var info = db.prepare(
    'INSERT INTO cinemas (name, address, city) VALUES (?, ?, ?)'
  ).run(name.trim(), address || null, (city || 'Kraków').trim());
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// PUT /api/cinemas/:id (admin)
router.put('/:id', requireAdmin, (req, res) => {
  var { name, address, city } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  var exists = db.prepare('SELECT 1 FROM cinemas WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Cinema not found.' });

  db.prepare(
    'UPDATE cinemas SET name = ?, address = ?, city = ? WHERE id = ?'
  ).run(name.trim(), address || null, (city || 'Kraków').trim(), req.params.id);
  res.json({ message: 'Cinema updated.' });
});

// DELETE /api/cinemas/:id (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  var info = db.prepare('DELETE FROM cinemas WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Cinema not found.' });
  res.json({ message: 'Cinema deleted.' });
});

module.exports = router;
