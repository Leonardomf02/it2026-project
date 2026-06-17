var db = require('../config/database');

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }
  // check the db so a block takes effect right away, not only on next login
  var user = db.prepare('SELECT status FROM users WHERE id = ?').get(req.session.user.id);
  if (!user) {
    req.session.destroy();
    return res.status(401).json({ error: 'You must be logged in.' });
  }
  if (user.status === 'blocked') {
    req.session.destroy();
    return res.status(403).json({ error: 'Your account has been blocked.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }
  var user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
