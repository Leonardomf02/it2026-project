var db = require('./config/database');

var movies = [
  {
    title: 'Diabeł ubiera się u Prady 2',
    release_date: '2026-05-01',
    genre: 'Comedy',
    director: 'David Frankel',
    actors: 'Meryl Streep, Anne Hathaway, Emily Blunt, Stanley Tucci',
    description: 'Długo wyczekiwana kontynuacja kultowej komedii o świecie mody.',
    poster_url: null
  },
  {
    title: 'Michael',
    release_date: '2026-04-17',
    genre: 'Biography',
    director: 'Antoine Fuqua',
    actors: 'Jaafar Jackson, Colman Domingo, Nia Long',
    description: 'Biograficzna opowieść o życiu Michaela Jacksona, króla popu.',
    poster_url: null
  },
  {
    title: 'Hamnet',
    release_date: '2026-02-13',
    genre: 'Drama',
    director: 'Chloé Zhao',
    actors: 'Paul Mescal, Jessie Buckley',
    description: 'Anglia, 1580. Historia tragedii, która zainspirowała Williama Szekspira do napisania Hamleta.',
    poster_url: null
  },
  {
    title: 'Wartość sentymentalna',
    release_date: '2025-12-05',
    genre: 'Drama',
    director: 'Joachim Trier',
    actors: 'Renate Reinsve, Stellan Skarsgård, Elle Fanning',
    description: 'Dwie siostry, reżyser-ojciec i hollywoodzka gwiazda. Laureat Grand Prix w Cannes.',
    poster_url: null
  },
  {
    title: 'Erupcja',
    release_date: '2026-04-10',
    genre: 'Drama',
    director: 'Peter Ohsa',
    actors: 'Charli XCX, Lena Góra',
    description: 'Pokaz w ramach festiwalu Mastercard OFF CAMERA.',
    poster_url: null
  },
  {
    title: 'Normal',
    release_date: '2026-04-24',
    genre: 'Drama',
    director: 'Adele Tulli',
    actors: 'Nieznani',
    description: 'Dokumentalna obserwacja codziennych rytuałów płci. Premiera 24 kwietnia.',
    poster_url: null
  },
  {
    title: 'Billie Eilish — Hit Me Hard and Soft: The Tour',
    release_date: '2026-05-08',
    genre: 'Music',
    director: 'James Cameron, Billie Eilish',
    actors: 'Billie Eilish, Finneas O\'Connell',
    description: 'Koncertowy film z trasy w formacie 2D i 3D.',
    poster_url: null
  },
  {
    title: 'Bez wyjścia',
    release_date: '2026-03-20',
    genre: 'Thriller',
    director: 'Daniel Jaroszek',
    actors: 'Maciej Musiał, Magdalena Cielecka',
    description: 'Polski thriller o desperackiej ucieczce przed przeszłością.',
    poster_url: null
  },
  {
    title: 'Wpatrując się w słońce',
    release_date: '2025-11-21',
    genre: 'Drama',
    director: 'Mascha Schilinski',
    actors: 'Hanna Heckt, Lea Drinda',
    description: 'Wielopokoleniowa saga rodzinna o tajemnicach starego gospodarstwa.',
    poster_url: null
  },
  {
    title: 'Pianista',
    release_date: '2002-09-25',
    genre: 'Drama',
    director: 'Roman Polański',
    actors: 'Adrien Brody, Thomas Kretschmann, Frank Finlay',
    description: 'Złota Palma w Cannes i trzy Oscary. Historia Władysława Szpilmana w czasie II wojny światowej.',
    poster_url: null
  },
  {
    title: 'Niewinni czarodzieje',
    release_date: '1960-12-16',
    genre: 'Drama',
    director: 'Andrzej Wajda',
    actors: 'Tadeusz Łomnicki, Krystyna Stypułkowska, Zbigniew Cybulski',
    description: 'Klasyk polskiego kina w cyklu "WAJDA: re-wizje" w Kinie Kijów.',
    poster_url: null
  },
  {
    title: 'Top Gun',
    release_date: '1986-05-16',
    genre: 'Action',
    director: 'Tony Scott',
    actors: 'Tom Cruise, Kelly McGillis, Val Kilmer',
    description: 'Kultowa historia pilotów marynarki wojennej. Pokazy specjalne z okazji Top Gun Day.',
    poster_url: null
  },
  {
    title: 'Żywot Briana',
    release_date: '1979-08-17',
    genre: 'Comedy',
    director: 'Terry Jones',
    actors: 'Graham Chapman, John Cleese, Michael Palin, Eric Idle',
    description: 'Klasyk Monty Pythona w specjalnym pokazie z prelekcją.',
    poster_url: null
  },
  {
    title: 'Paterson',
    release_date: '2016-12-28',
    genre: 'Drama',
    director: 'Jim Jarmusch',
    actors: 'Adam Driver, Golshifteh Farahani',
    description: 'Poetycki portret kierowcy autobusu z New Jersey. Cykl KINOVERSUM — obraz, który mówi wierszem.',
    poster_url: null
  },
  {
    title: 'Ból i blask',
    release_date: '2019-09-27',
    genre: 'Drama',
    director: 'Pedro Almodóvar',
    actors: 'Antonio Banderas, Penélope Cruz, Asier Etxeandia',
    description: 'Sentymentalna autobiografia reżysera. Pokaz w Dyskusyjnym Klubie Filmowym.',
    poster_url: null
  }
];

// Preferred cinemas per movie index (0-based). Indexes into the cinemas array below.
// Art-house films go to art-house cinemas; new releases also go to multiplexes.
var cinemas = [
  { name: 'Kino Pod Baranami', address: 'Rynek Główny 27', city: 'Kraków' },
  { name: 'Kino Mikro', address: 'Lea 5', city: 'Kraków' },
  { name: 'Kino Kijów', address: 'al. Krasińskiego 34', city: 'Kraków' },
  { name: 'Multikino Kraków', address: 'ul. Dobrego Pasterza 128', city: 'Kraków' },
  { name: 'Cinema City Bonarka', address: 'ul. Kamieńskiego 11', city: 'Kraków' },
  { name: 'Kino Paradox', address: 'ul. Krupnicza 38', city: 'Kraków' }
];

// Which cinemas each film plays in (by cinema index 0-5)
var moviePrograms = [
  [0, 2, 3, 4],   // Diabeł ubiera się u Prady 2  — wide release
  [0, 3, 4],      // Michael — wide release
  [0, 1],         // Hamnet — art-house
  [0, 1, 2],      // Wartość sentymentalna — art-house + Kijów
  [0],            // Erupcja — festival screening
  [2, 5],         // Normal — premiere at Kijów + Paradox
  [0, 3, 4],      // Billie Eilish concert — wide
  [3, 4],         // Bez wyjścia — multiplex
  [1],            // Wpatrując się w słońce — Kino Mikro
  [0],            // Pianista (re-play) — Pod Baranami cycle
  [2],            // Niewinni czarodzieje — Kijów (Wajda cycle)
  [2],            // Top Gun — Kijów (Top Gun Day)
  [2],            // Żywot Briana — Kijów special
  [5],            // Paterson — Paradox (KINOVERSUM)
  [5]             // Ból i blask — Paradox (DKF)
];

var count = db.prepare('SELECT COUNT(*) as n FROM movies').get().n;
if (count > 0) {
  console.log('Database already seeded (' + count + ' movies). Skipping.');
  process.exit(0);
}

var insertMovie = db.prepare(
  'INSERT INTO movies (title, release_date, genre, director, actors, description, poster_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
var insertCinema = db.prepare(
  'INSERT INTO cinemas (name, address, city) VALUES (?, ?, ?)'
);
var insertScreening = db.prepare(
  'INSERT INTO screenings (movie_id, cinema_id, screening_time, hall) VALUES (?, ?, ?, ?)'
);

var seed = db.transaction(() => {
  var movieIds = [];
  for (var m of movies) {
    var info = insertMovie.run(m.title, m.release_date, m.genre, m.director, m.actors, m.description, m.poster_url);
    movieIds.push(Number(info.lastInsertRowid));
  }

  var cinemaIds = [];
  for (var c of cinemas) {
    var ci = insertCinema.run(c.name, c.address, c.city);
    cinemaIds.push(Number(ci.lastInsertRowid));
  }

  // Generate screenings for the next 7 days, using the moviePrograms matrix.
  // For each (movie, cinema-it-plays-at) pair, schedule 2-4 slots across the week.
  var timeSlots = ['12:30', '15:00', '17:30', '19:00', '20:30', '22:00'];
  var halls = ['Sala 1', 'Sala 2', 'Sala Duża', 'Sala Kameralna'];
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var screeningCount = 0;
  for (var i = 0; i < movieIds.length; i++) {
    var cinemasForMovie = moviePrograms[i];
    cinemasForMovie.forEach(function (ci) {
      // 3 screenings per (movie, cinema) across the next 7 days
      for (var k = 0; k < 3; k++) {
        var day = new Date(today);
        day.setDate(today.getDate() + ((i + k * 2 + ci) % 7));
        var iso = day.toISOString().slice(0, 10);
        var time = timeSlots[(i + ci + k) % timeSlots.length];
        var hall = halls[(i + ci) % halls.length];
        insertScreening.run(movieIds[i], cinemaIds[ci], iso + ' ' + time, hall);
        screeningCount++;
      }
    });
  }

  console.log('Seeded ' + movies.length + ' movies, ' + cinemas.length + ' cinemas, ' + screeningCount + ' screenings for the next 7 days.');
});

seed();
