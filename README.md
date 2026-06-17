# CineSpot

Movie database for cinemas in Kraków. Browse what's showing, filter by cinema/date/genre/director/actor, rate films, build a watchlist and favourites. Admin side handles CRUD for movies, cinemas, screenings, plus user management (block, delete, change role).

Uni project for Internet Technologies (Kraków, 2026), Team G.

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
npm run seed     # first time only - fills the db with movies, cinemas, screenings
npm start
```

Open http://localhost:3003.

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
  ratings.js           0-10 ratings per user/movie
  admin.js             user management (block, delete, change role)
middleware/auth.js     session + admin guards
public/                frontend
  index.html
  css/style.css
  js/app.js            SPA-ish, talks to the api via jQuery AJAX
seed.js                populates db with 15 movies, 6 Kraków cinemas and a week of screenings (16-22 June 2026)
```

## Database

SQLite file `movies.db` is created in the project root on first run. To wipe and start over:

```bash
rm movies.db*
npm start        # recreates the schema + admin user
npm run seed     # repopulate
```

The seed script is idempotent: it skips seeding if movies already exist.

