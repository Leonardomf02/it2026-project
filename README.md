# CineSpot

Movie database for cinemas in Kraków. Browse what's showing, filter by cinema/date/genre/director/actor, rate films, build a watchlist and favourites. Admin side handles CRUD for movies, cinemas, screenings, plus user management (block, delete, change role).

Uni project for Internet Technologies (Kraków, 2026) — Team G.

## Stack

- Node.js + Express 5
- SQLite via `better-sqlite3`
- `bcrypt` + `express-session` for auth
- Plain HTML/CSS/JS on the frontend, no framework

## Run it

Needs Node 18+.

```bash
git clone https://github.com/Leonardomf02/it2026-project.git
cd it2026-project
npm install
npm run seed     # first time only — fills the db with movies, cinemas, screenings
npm start
```

Open http://localhost:3000.

## Default admin

```
user:  admin
pass:  admin123
```

Created automatically on first run. Change the password from the admin panel after logging in.

## Layout

```
server.js              express bootstrap + routes mounting
config/database.js     sqlite schema + initial admin
routes/                api endpoints
  auth.js              register / login / logout / session
  movies.js            list, search, filter, CRUD (admin)
  cinemas.js           list + CRUD (admin)
  screenings.js        list + filter by movie/cinema/date + CRUD (admin)
  favourites.js        favourite movies, actors, cinemas
  watchlist.js         per-user watchlist
  ratings.js           1–10 ratings per user/movie
  admin.js             user management (block, delete, change role)
middleware/auth.js     session + admin guards
public/                frontend
  index.html
  css/style.css
  js/app.js            SPA-ish, talks to the api via fetch
seed.js                populates db with 15 movies, 6 Kraków cinemas and screenings for the next 7 days
```

## Database

SQLite file `movies.db` is created in the project root on first run. To wipe and start over:

```bash
rm movies.db*
npm start        # recreates the schema + admin user
npm run seed     # repopulate
```

The seed script is idempotent — it skips seeding if movies already exist.

## Notes

- Port defaults to 3000. Override: `PORT=4000 npm start`.
- Sessions are stored in memory, so they reset on server restart.
- The `WAL` files (`movies.db-shm`, `movies.db-wal`) are SQLite's write-ahead log — safe to delete when the server is stopped.
