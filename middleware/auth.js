function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }
  if (req.session.user.status === 'blocked') {
    req.session.destroy();
    return res.status(403).json({ error: 'Your account has been blocked.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
