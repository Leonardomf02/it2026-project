var express = require('express');
var session = require('express-session');
var path = require('path');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'moviedb-session-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

app.use(express.static(path.join(__dirname, 'public')));

// api routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/cinemas', require('./routes/cinemas'));
app.use('/api/screenings', require('./routes/screenings'));
app.use('/api/favourites', require('./routes/favourites'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/admin', require('./routes/admin'));

// SPA fallback — send index.html for any non-API request
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
