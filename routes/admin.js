var express = require('express');
var db = require('../config/database');
var { requireAdmin } = require('../middleware/auth');

var router = express.Router();

router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', (req, res) => {
  var rows = db.prepare(
    'SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(rows);
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', (req, res) => {
  var role = req.body.role;
  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  var user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'Role updated.' });
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', (req, res) => {
  var status = req.body.status;
  if (status !== 'active' && status !== 'blocked') {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  var user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated.' });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  if (Number(req.params.id) === req.session.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself.' });
  }

  var info = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'User deleted.' });
});

module.exports = router;
