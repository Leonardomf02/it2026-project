$(function () {

  var currentUser = null;
  var favIds = [];
  var watchIds = [];
  var favCinemaIds = [];
  var favActors = [];
  var cinemaCache = [];

  // helpers
  function toast(msg) {
    var el = $('#toast');
    el.text(msg).addClass('show');
    setTimeout(function () { el.removeClass('show'); }, 2500);
  }

  function openModal(id) { $('#' + id).addClass('open'); }
  function closeModal(id) { $('#' + id).removeClass('open'); }

  function yearOf(date) { return date ? String(date).slice(0, 4) : ''; }
  function formatScreening(iso) {
    if (!iso) return '';
    var s = iso.replace('T', ' ');
    return s.length >= 16 ? s.slice(0, 16) : s;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function hashHue(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
  }

  function noPoster(movie, klass) {
    var hue = hashHue(movie.title || '');
    var year = yearOf(movie.release_date);
    var style = '--np-h:' + hue + ';';
    return '<div class="' + klass + '" style="' + style + '">' +
      '<span class="np-title">' + escapeHtml(movie.title || '') + '</span>' +
      (year ? '<span class="np-year">' + year + '</span>' : '') +
      '</div>';
  }

  $('.modal-close').on('click', function () {
    closeModal($(this).data('modal'));
  });
  $('.modal').on('click', function (e) {
    if (e.target === this) closeModal(this.id);
  });

  // navigation
  function showPage(name) {
    $('.page').hide();
    $('#page-' + name).show();
    $('.nav-btn').removeClass('active');
    $('#btn-' + name).addClass('active');

    if (name === 'cinemas') fetchCinemas();
    if (name === 'screenings') fetchScreenings();
    if (name === 'favourites') loadFavouritesPage();
    if (name === 'watchlist') fetchWatchlist();
    if (name === 'admin') { fetchUsers(); fetchAdminMovies(); fetchAdminCinemas(); fetchAdminScreenings(); }
  }

  $('#btn-home, #logo-link').on('click', function (e) { e.preventDefault(); showPage('home'); });
  $('#btn-cinemas').on('click', function () { showPage('cinemas'); });
  $('#btn-screenings').on('click', function () { showPage('screenings'); });
  $('#btn-favourites').on('click', function () { showPage('favourites'); });
  $('#btn-watchlist').on('click', function () { showPage('watchlist'); });
  $('#btn-admin').on('click', function () { showPage('admin'); });

  // navbar refresh
  function refreshNav() {
    if (currentUser) {
      $('#btn-account').hide();
      $('#btn-logout, #btn-favourites, #btn-watchlist').show();
      $('#user-greeting').text('Hi, ' + currentUser.username).show();
      if (currentUser.role === 'admin') {
        $('#btn-admin, #btn-add-movie').show();
      } else {
        $('#btn-admin, #btn-add-movie').hide();
      }
    } else {
      $('#btn-account').show();
      $('#btn-logout, #btn-favourites, #btn-watchlist, #btn-admin, #btn-add-movie').hide();
      $('#user-greeting').hide();
      favIds = [];
      watchIds = [];
      favCinemaIds = [];
      favActors = [];
    }
  }

  // auth
  function fetchSession() {
    $.get('/api/auth/session').done(function (data) {
      if (data.user) {
        currentUser = data.user;
        refreshNav();
        fetchUserLists(function () { fetchMovies(); });
      } else {
        currentUser = null;
        refreshNav();
        fetchMovies();
      }
    });
  }

  function fetchUserLists(callback) {
    if (!currentUser) {
      favIds = []; watchIds = []; favCinemaIds = []; favActors = [];
      if (callback) callback();
      return;
    }
    var pending = 4;
    function step() { pending--; if (pending === 0 && callback) callback(); }

    $.get('/api/favourites').done(function (data) {
      favIds = data.map(function (m) { return m.id; }); step();
    }).fail(function () { favIds = []; step(); });

    $.get('/api/watchlist').done(function (data) {
      watchIds = data.map(function (m) { return m.id; }); step();
    }).fail(function () { watchIds = []; step(); });

    $.get('/api/favourites/cinemas').done(function (data) {
      favCinemaIds = data.map(function (c) { return c.id; }); step();
    }).fail(function () { favCinemaIds = []; step(); });

    $.get('/api/favourites/actors').done(function (data) {
      favActors = data || []; step();
    }).fail(function () { favActors = []; step(); });
  }

  $('#btn-account').on('click', function () { openModal('modal-auth'); });

  $(document).on('click', '.auth-tab', function () {
    $('.auth-tab').removeClass('active');
    $(this).addClass('active');
    $('.auth-panel').hide();
    $('#' + $(this).data('target')).show();
    $('#login-error, #register-error').text('');
  });

  $('#form-login').on('submit', function (e) {
    e.preventDefault();
    var form = $(this);
    $.ajax({
      url: '/api/auth/login', method: 'POST', contentType: 'application/json',
      data: JSON.stringify({
        username: form.find('[name=username]').val(),
        password: form.find('[name=password]').val()
      })
    }).done(function (data) {
      currentUser = data.user;
      closeModal('modal-auth');
      form[0].reset();
      $('#login-error').text('');
      refreshNav();
      fetchUserLists(function () { fetchMovies(); });
      toast('Logged in as ' + currentUser.username);
    }).fail(function (xhr) {
      $('#login-error').text(xhr.responseJSON ? xhr.responseJSON.error : 'Login failed.');
    });
  });

  $('#form-register').on('submit', function (e) {
    e.preventDefault();
    var form = $(this);
    $.ajax({
      url: '/api/auth/register', method: 'POST', contentType: 'application/json',
      data: JSON.stringify({
        username: form.find('[name=username]').val(),
        email: form.find('[name=email]').val(),
        password: form.find('[name=password]').val()
      })
    }).done(function () {
      form[0].reset();
      $('#register-error').text('');
      toast('Account created! You can now log in.');
      $('.auth-tab[data-target=auth-login]').click();
    }).fail(function (xhr) {
      $('#register-error').text(xhr.responseJSON ? xhr.responseJSON.error : 'Registration failed.');
    });
  });

  $('#btn-logout').on('click', function () {
    $.post('/api/auth/logout').always(function () {
      currentUser = null;
      refreshNav();
      showPage('home');
      fetchMovies();
      toast('Logged out.');
    });
  });

  // movies
  function fetchMovies() {
    var params = {};
    var title = $('#filter-title').val();
    var genre = $('#filter-genre').val();
    var director = $('#filter-director').val();
    var actor = $('#filter-actor').val();
    var cinemaId = $('#filter-cinema').val();
    var screeningDate = $('#filter-screening-date').val();
    var releaseDate = $('#filter-release-date').val();

    if (title) params.title = title;
    if (genre) params.genre = genre;
    if (director) params.director = director;
    if (actor) params.actor = actor;
    if (cinemaId) params.cinema_id = cinemaId;
    if (screeningDate) params.screening_date = screeningDate;
    if (releaseDate) params.release_date = releaseDate;
    var showAll = $('#filter-show-all').is(':checked');
    if (!showAll) params.now_playing = '1';
    params.sort = $('#sort-by').val();
    params.order = $('#sort-order').val();

    $('#now-playing-note').toggle(!showAll);

    $.get('/api/movies', params).done(function (movies) {
      renderMovieGrid(movies, '#movie-grid');
    });
  }

  function renderMovieGrid(movies, container) {
    var grid = $(container).empty();
    if (movies.length === 0) {
      grid.append('<p style="color:var(--text-secondary);">No movies found.</p>');
      return;
    }
    movies.forEach(function (m) {
      var liked = favIds.indexOf(m.id) !== -1;
      var inWatch = watchIds.indexOf(m.id) !== -1;
      var favButton = '';
      var watchButton = '';
      if (currentUser) {
        favButton = '<button class="fav-btn ' + (liked ? 'liked' : '') + '" data-id="' + m.id + '">' +
          (liked ? '&#9829;' : '&#9825;') + '</button>';
        watchButton = '<button class="watch-btn ' + (inWatch ? 'added' : '') + '" data-id="' + m.id + '" title="Watchlist">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (inWatch ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>';
      }
      var fallback = noPoster(m, 'no-poster');
      var posterHtml = m.poster_url
        ? '<img src="' + m.poster_url + '" alt="' + escapeHtml(m.title) + '" onerror="this.parentNode.innerHTML=this.parentNode.dataset.fallback;">'
        : fallback;
      var card = '<div class="movie-card" data-id="' + m.id + '">' +
        '<div class="card-poster" data-fallback="' + escapeHtml(fallback) + '">' + posterHtml + '<div class="card-actions">' + favButton + watchButton + '</div></div>' +
        '<div class="card-info">' +
          '<h3>' + escapeHtml(m.title) + '</h3>' +
          '<p>' + yearOf(m.release_date) + (m.genre ? ' &middot; ' + escapeHtml(m.genre) : '') + '</p>' +
        '</div></div>';
      grid.append(card);
    });
  }

  // clicking a card opens detail
  $(document).on('click', '.movie-card', function (e) {
    if ($(e.target).closest('.fav-btn, .watch-btn').length) return;
    var id = $(this).data('id');

    $.get('/api/movies/' + id).done(function (m) {
      var detailFallback = noPoster(m, 'no-poster-detail');
      var posterHtml = m.poster_url
        ? '<div class="detail-poster" data-fallback="' + escapeHtml(detailFallback) + '">' +
            '<img src="' + m.poster_url + '" alt="' + escapeHtml(m.title) + '" onerror="this.parentNode.outerHTML=this.parentNode.dataset.fallback;">' +
          '</div>'
        : detailFallback;

      var actorsHtml = '';
      if (m.actors) {
        actorsHtml = m.actors.split(',').map(function (a) {
          var name = a.trim();
          if (!name) return '';
          var liked = currentUser && favActors.indexOf(name) !== -1;
          var btn = currentUser
            ? '<button class="actor-fav-btn ' + (liked ? 'liked' : '') + '" data-name="' + escapeHtml(name) + '" title="Favourite actor">' + (liked ? '&#9829;' : '&#9825;') + '</button>'
            : '';
          return '<span class="actor-chip">' + escapeHtml(name) + btn + '</span>';
        }).join(' ');
      }

      var ratingHtml = '<div class="rating-section" data-movie-id="' + m.id + '">' +
        '<p class="rating-avg">Loading...</p>' +
        (currentUser ? '<div class="rating-input"><label>Your rating:</label><select class="rating-select"><option value="">-</option>' +
          (function(){ var o=''; for(var i=0;i<=10;i++) o+='<option value="'+i+'">'+i+'</option>'; return o; })() +
          '</select></div>' : '') +
        '</div>';

      $('#detail-body').html(
        posterHtml +
        '<div class="detail-info">' +
          '<h2>' + escapeHtml(m.title) + '</h2>' +
          '<p><strong>Release date:</strong> ' + (m.release_date || 'N/A') + '</p>' +
          '<p><strong>Genre:</strong> ' + escapeHtml(m.genre || 'N/A') + '</p>' +
          '<p><strong>Director:</strong> ' + escapeHtml(m.director || 'N/A') + '</p>' +
          '<p><strong>Actors:</strong> ' + (actorsHtml || 'N/A') + '</p>' +
          '<p><strong>Description:</strong> ' + escapeHtml(m.description || 'No description.') + '</p>' +
          '<h3>Upcoming screenings</h3>' +
          '<div class="movie-screenings">Loading...</div>' +
          ratingHtml +
        '</div>'
      );

      $.get('/api/movies/' + m.id + '/screenings').done(function (list) {
        var box = $('#modal-detail .movie-screenings');
        if (!list.length) { box.text('No upcoming screenings.'); return; }
        box.html(list.map(function (s) {
          return '<div class="screening-row">' +
            '<strong>' + formatScreening(s.screening_time) + '</strong> — ' +
            escapeHtml(s.cinema_name) + (s.cinema_city ? ' (' + escapeHtml(s.cinema_city) + ')' : '') +
            (s.hall ? ' · ' + escapeHtml(s.hall) : '') +
            '</div>';
        }).join(''));
      });

      $.get('/api/ratings/' + m.id).done(function (r) {
        var avgText = r.average !== null ? r.average + '/10 (' + r.count + ' votes)' : 'No ratings yet';
        $('.rating-section[data-movie-id=' + m.id + '] .rating-avg').html('<strong>Rating:</strong> ' + avgText);
        if (r.userRating !== null && r.userRating !== undefined) {
          $('.rating-section[data-movie-id=' + m.id + '] .rating-select').val(r.userRating);
        }
      });

      openModal('modal-detail');
    });
  });

  // favourite movie toggle
  $(document).on('click', '.fav-btn', function (e) {
    e.stopPropagation();
    var btn = $(this);
    var movieId = btn.data('id');

    if (btn.hasClass('liked')) {
      $.ajax({ url: '/api/favourites/' + movieId, method: 'DELETE' }).done(function () {
        btn.removeClass('liked').html('&#9825;');
        favIds = favIds.filter(function (id) { return id !== movieId; });
        toast('Removed from favourites.');
      });
    } else {
      $.ajax({ url: '/api/favourites/' + movieId, method: 'POST' }).done(function () {
        btn.addClass('liked').html('&#9829;');
        favIds.push(movieId);
        toast('Added to favourites!');
      });
    }
  });

  // favourite actor toggle
  $(document).on('click', '.actor-fav-btn', function (e) {
    e.stopPropagation();
    if (!currentUser) return;
    var btn = $(this);
    var name = btn.data('name');

    if (btn.hasClass('liked')) {
      $.ajax({
        url: '/api/favourites/actors', method: 'DELETE',
        contentType: 'application/json', data: JSON.stringify({ actor_name: name })
      }).done(function () {
        btn.removeClass('liked').html('&#9825;');
        favActors = favActors.filter(function (a) { return a !== name; });
        toast('Removed ' + name + '.');
      });
    } else {
      $.ajax({
        url: '/api/favourites/actors', method: 'POST',
        contentType: 'application/json', data: JSON.stringify({ actor_name: name })
      }).done(function () {
        btn.addClass('liked').html('&#9829;');
        favActors.push(name);
        toast('Added favourite actor: ' + name);
      });
    }
  });

  // watchlist toggle
  $(document).on('click', '.watch-btn', function (e) {
    e.stopPropagation();
    var btn = $(this);
    var movieId = btn.data('id');

    if (btn.hasClass('added')) {
      $.ajax({ url: '/api/watchlist/' + movieId, method: 'DELETE' }).done(function () {
        btn.removeClass('added').find('svg').attr('fill', 'none');
        watchIds = watchIds.filter(function (id) { return id !== movieId; });
        toast('Removed from watchlist.');
      });
    } else {
      $.ajax({ url: '/api/watchlist/' + movieId, method: 'POST' }).done(function () {
        btn.addClass('added').find('svg').attr('fill', 'currentColor');
        watchIds.push(movieId);
        toast('Added to watchlist!');
      });
    }
  });

  // rating change
  $(document).on('change', '.rating-select', function () {
    var section = $(this).closest('.rating-section');
    var movieId = section.data('movie-id');
    var val = $(this).val();

    if (val === '') {
      $.ajax({ url: '/api/ratings/' + movieId, method: 'DELETE' }).done(function () {
        toast('Rating removed.');
        refreshRating(section, movieId);
      });
    } else {
      $.ajax({
        url: '/api/ratings/' + movieId, method: 'POST',
        contentType: 'application/json', data: JSON.stringify({ score: Number(val) })
      }).done(function () {
        toast('Rated ' + val + '/10');
        refreshRating(section, movieId);
      });
    }
  });

  function refreshRating(section, movieId) {
    $.get('/api/ratings/' + movieId).done(function (r) {
      var avgText = r.average !== null ? r.average + '/10 (' + r.count + ' votes)' : 'No ratings yet';
      section.find('.rating-avg').html('<strong>Rating:</strong> ' + avgText);
    });
  }

  // search / filter — movies page
  $('#btn-search').on('click', fetchMovies);
  $('#btn-clear').on('click', function () {
    $('#filter-title, #filter-director, #filter-actor, #filter-screening-date, #filter-release-date').val('');
    $('#filter-genre, #filter-cinema').val('');
    $('#filter-show-all').prop('checked', false);
    $('#sort-by').val('created_at');
    $('#sort-order').val('desc');
    fetchMovies();
  });
  $('#filter-title').on('keypress', function (e) { if (e.which === 13) fetchMovies(); });
  $('#sort-by, #sort-order, #filter-genre, #filter-cinema').on('change', fetchMovies);
  $('#filter-screening-date, #filter-release-date, #filter-show-all').on('change', fetchMovies);

  // dropdowns populate
  function fetchGenres() {
    $.get('/api/movies/genres').done(function (genres) {
      var sel = $('#filter-genre');
      sel.find('option:not(:first)').remove();
      genres.forEach(function (g) {
        sel.append('<option value="' + escapeHtml(g) + '">' + escapeHtml(g) + '</option>');
      });
    });
  }

  function populateCinemaDropdowns(cinemas) {
    cinemaCache = cinemas;
    var targets = ['#filter-cinema', '#screenings-filter-cinema', '#form-screening select[name=cinema_id]'];
    targets.forEach(function (sel) {
      var $sel = $(sel);
      var first = $sel.find('option:first').prop('outerHTML') || '<option value="">Select cinema</option>';
      $sel.html(first);
      cinemas.forEach(function (c) {
        $sel.append('<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>');
      });
    });
  }

  function fetchAllCinemas() {
    $.get('/api/cinemas').done(populateCinemaDropdowns);
  }

  function populateMovieDropdown() {
    $.get('/api/movies').done(function (movies) {
      var $sel = $('#form-screening select[name=movie_id]');
      $sel.html('<option value="">Select movie</option>');
      movies.forEach(function (m) {
        $sel.append('<option value="' + m.id + '">' + escapeHtml(m.title) + '</option>');
      });
    });
  }

  // ---- Cinemas page ----
  function fetchCinemas() {
    var params = {};
    var name = $('#cinema-filter-name').val();
    var city = $('#cinema-filter-city').val();
    if (name) params.name = name;
    if (city) params.city = city;

    $.get('/api/cinemas', params).done(function (cinemas) {
      renderCinemaList(cinemas, '#cinema-list');
    });
  }

  function renderCinemaList(cinemas, container) {
    var box = $(container).empty();
    if (cinemas.length === 0) {
      box.append('<p style="color:var(--text-secondary);">No cinemas found.</p>');
      return;
    }
    cinemas.forEach(function (c) {
      var liked = favCinemaIds.indexOf(c.id) !== -1;
      var favBtn = currentUser
        ? '<button class="cinema-fav-btn ' + (liked ? 'liked' : '') + '" data-id="' + c.id + '">' + (liked ? '&#9829;' : '&#9825;') + '</button>'
        : '';
      box.append('<div class="cinema-card" data-id="' + c.id + '">' +
        '<div class="cinema-card-head"><h3>' + escapeHtml(c.name) + '</h3>' + favBtn + '</div>' +
        '<p>' + escapeHtml(c.address || '') + (c.city ? ', ' + escapeHtml(c.city) : '') + '</p>' +
        '<button class="btn btn-small btn-cinema-screenings" data-id="' + c.id + '" data-name="' + escapeHtml(c.name) + '">Show screenings</button>' +
        '</div>');
    });
  }

  $('#btn-cinema-search').on('click', fetchCinemas);
  $('#btn-cinema-clear').on('click', function () {
    $('#cinema-filter-name, #cinema-filter-city').val('');
    fetchCinemas();
  });
  $('#cinema-filter-name').on('keypress', function (e) { if (e.which === 13) fetchCinemas(); });

  // favourite cinema toggle
  $(document).on('click', '.cinema-fav-btn', function (e) {
    e.stopPropagation();
    var btn = $(this);
    var id = btn.data('id');

    if (btn.hasClass('liked')) {
      $.ajax({ url: '/api/favourites/cinemas/' + id, method: 'DELETE' }).done(function () {
        btn.removeClass('liked').html('&#9825;');
        favCinemaIds = favCinemaIds.filter(function (x) { return x !== id; });
        toast('Cinema removed from favourites.');
      });
    } else {
      $.ajax({ url: '/api/favourites/cinemas/' + id, method: 'POST' }).done(function () {
        btn.addClass('liked').html('&#9829;');
        favCinemaIds.push(id);
        toast('Cinema added to favourites!');
      });
    }
  });

  // show cinema screenings
  $(document).on('click', '.btn-cinema-screenings', function (e) {
    e.stopPropagation();
    var id = $(this).data('id');
    showPage('screenings');
    $('#screenings-filter-cinema').val(id);
    fetchScreenings();
  });

  // ---- Screenings page ----
  function fetchScreenings() {
    var params = {};
    var cinemaId = $('#screenings-filter-cinema').val();
    var date = $('#screenings-filter-date').val();
    if (cinemaId) params.cinema_id = cinemaId;
    if (date) params.date = date;

    $.get('/api/screenings', params).done(function (list) {
      renderScreeningsList(list, '#screenings-list');
    });
  }

  function renderScreeningsList(list, container) {
    var box = $(container).empty();
    if (list.length === 0) {
      box.append('<p style="color:var(--text-secondary);">No screenings found.</p>');
      return;
    }
    list.forEach(function (s) {
      box.append('<div class="screening-card">' +
        '<div class="screening-time">' + formatScreening(s.screening_time) + '</div>' +
        '<div class="screening-movie"><strong>' + escapeHtml(s.movie_title) + '</strong></div>' +
        '<div class="screening-venue">' + escapeHtml(s.cinema_name) + (s.hall ? ' · ' + escapeHtml(s.hall) : '') + '</div>' +
        '</div>');
    });
  }

  $('#btn-screenings-search').on('click', fetchScreenings);
  $('#btn-screenings-clear').on('click', function () {
    $('#screenings-filter-cinema, #screenings-filter-date').val('');
    fetchScreenings();
  });
  $('#screenings-filter-cinema, #screenings-filter-date').on('change', fetchScreenings);

  // ---- Favourites page ----
  function loadFavouritesPage() {
    $('.fav-tab').removeClass('active').first().addClass('active');
    $('.fav-panel').hide();
    $('#fav-movies').show();
    fetchFavMovies();
    fetchFavActors();
    fetchFavCinemasSection();
  }

  $(document).on('click', '.fav-tab', function () {
    $('.fav-tab').removeClass('active');
    $(this).addClass('active');
    $('.fav-panel').hide();
    $('#' + $(this).data('tab')).show();
  });

  function fetchFavMovies() {
    $.get('/api/favourites').done(function (movies) {
      if (movies.length === 0) {
        $('#fav-grid').empty();
        $('#fav-empty').show();
      } else {
        $('#fav-empty').hide();
        renderMovieGrid(movies, '#fav-grid');
      }
    });
  }

  function fetchFavActors() {
    $.get('/api/favourites/actors').done(function (actors) {
      favActors = actors || [];
      var ul = $('#fav-actors-list').empty();
      if (actors.length === 0) {
        ul.append('<li style="color:var(--text-secondary);">No favourite actors yet. Add one above, or click the heart on an actor name in a movie detail.</li>');
      } else {
        actors.forEach(function (a) {
          ul.append('<li class="chip">' + escapeHtml(a) +
            ' <button class="chip-remove" data-name="' + escapeHtml(a) + '" title="Remove">&times;</button></li>');
        });
      }
      $.get('/api/favourites/actors/movies').done(function (movies) {
        renderMovieGrid(movies, '#fav-actors-movies');
      });
    });
  }

  $('#form-add-actor').on('submit', function (e) {
    e.preventDefault();
    var name = $(this).find('[name=actor_name]').val().trim();
    if (!name) return;
    $.ajax({
      url: '/api/favourites/actors', method: 'POST',
      contentType: 'application/json', data: JSON.stringify({ actor_name: name })
    }).done(function () {
      $('#form-add-actor')[0].reset();
      toast('Actor added.');
      fetchFavActors();
    }).fail(function (xhr) {
      toast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed.');
    });
  });

  $(document).on('click', '.chip-remove', function () {
    var name = $(this).data('name');
    $.ajax({
      url: '/api/favourites/actors', method: 'DELETE',
      contentType: 'application/json', data: JSON.stringify({ actor_name: name })
    }).done(function () {
      favActors = favActors.filter(function (a) { return a !== name; });
      toast('Removed.');
      fetchFavActors();
    });
  });

  function fetchFavCinemasSection() {
    $.get('/api/favourites/cinemas').done(function (cinemas) {
      favCinemaIds = cinemas.map(function (c) { return c.id; });
      if (cinemas.length === 0) {
        $('#fav-cinemas-list').empty();
        $('#fav-cinemas-empty').show();
      } else {
        $('#fav-cinemas-empty').hide();
        renderCinemaList(cinemas, '#fav-cinemas-list');
      }
    });
    $.get('/api/favourites/cinemas/screenings').done(function (list) {
      renderScreeningsList(list, '#fav-cinemas-screenings');
    });
  }

  // ---- Watchlist ----
  function fetchWatchlist() {
    $.get('/api/watchlist').done(function (movies) {
      if (movies.length === 0) {
        $('#watch-grid').empty();
        $('#watch-empty').show();
      } else {
        $('#watch-empty').hide();
        renderMovieGrid(movies, '#watch-grid');
      }
    });
  }

  // ---- Admin: users ----
  function fetchUsers() {
    $.get('/api/admin/users').done(function (users) {
      var tbody = $('#users-table tbody').empty();
      users.forEach(function (u) {
        var roleClass = u.role === 'admin' ? 'badge-admin' : 'badge-user';
        var statusClass = u.status === 'active' ? 'badge-active' : 'badge-blocked';

        var actions = '';
        if (u.id !== currentUser.id) {
          var toggleRole = u.role === 'admin' ? 'user' : 'admin';
          var toggleStatus = u.status === 'active' ? 'blocked' : 'active';
          actions = '<button class="action-btn btn-toggle-role" data-id="' + u.id + '" data-role="' + toggleRole + '">Make ' + toggleRole + '</button>' +
            '<button class="action-btn btn-toggle-status" data-id="' + u.id + '" data-status="' + toggleStatus + '">' + (u.status === 'active' ? 'Block' : 'Unblock') + '</button>' +
            '<button class="action-btn danger btn-delete-user" data-id="' + u.id + '">Delete</button>';
        }

        tbody.append('<tr>' +
          '<td>' + u.id + '</td>' +
          '<td>' + escapeHtml(u.username) + '</td>' +
          '<td>' + escapeHtml(u.email) + '</td>' +
          '<td><span class="badge ' + roleClass + '">' + u.role + '</span></td>' +
          '<td><span class="badge ' + statusClass + '">' + u.status + '</span></td>' +
          '<td>' + actions + '</td>' +
        '</tr>');
      });
    });
  }

  $(document).on('click', '.btn-toggle-role', function () {
    var id = $(this).data('id');
    var role = $(this).data('role');
    $.ajax({
      url: '/api/admin/users/' + id + '/role', method: 'PUT',
      contentType: 'application/json', data: JSON.stringify({ role: role })
    }).done(function () { toast('Role updated.'); fetchUsers(); });
  });

  $(document).on('click', '.btn-toggle-status', function () {
    var id = $(this).data('id');
    var status = $(this).data('status');
    $.ajax({
      url: '/api/admin/users/' + id + '/status', method: 'PUT',
      contentType: 'application/json', data: JSON.stringify({ status: status })
    }).done(function () { toast('Status updated.'); fetchUsers(); });
  });

  $(document).on('click', '.btn-delete-user', function () {
    var id = $(this).data('id');
    if (!confirm('Delete this user?')) return;
    $.ajax({ url: '/api/admin/users/' + id, method: 'DELETE' }).done(function () {
      toast('User deleted.'); fetchUsers();
    });
  });

  // ---- Admin: movies ----
  function fetchAdminMovies() {
    $.get('/api/movies').done(function (movies) {
      var tbody = $('#admin-movies-table tbody').empty();
      movies.forEach(function (m) {
        tbody.append('<tr>' +
          '<td>' + m.id + '</td>' +
          '<td>' + escapeHtml(m.title) + '</td>' +
          '<td>' + (m.release_date || '') + '</td>' +
          '<td>' + escapeHtml(m.genre || '') + '</td>' +
          '<td>' + escapeHtml(m.director || '') + '</td>' +
          '<td>' +
            '<button class="action-btn btn-edit-movie" data-id="' + m.id + '">Edit</button>' +
            '<button class="action-btn danger btn-delete-movie" data-id="' + m.id + '">Delete</button>' +
          '</td>' +
        '</tr>');
      });
    });
  }

  $(document).on('click', '.admin-tab', function () {
    $('.admin-tab').removeClass('active');
    $(this).addClass('active');
    $('.tab-content').hide();
    $('#' + $(this).data('tab')).show();
  });

  $('#btn-add-movie').on('click', function () {
    $('#movie-form-title').text('Add Movie');
    $('#form-movie')[0].reset();
    $('#form-movie [name=id]').val('');
    $('#movie-error').text('');
    openModal('modal-movie');
  });

  $(document).on('click', '.btn-edit-movie', function () {
    var id = $(this).data('id');
    $.get('/api/movies/' + id).done(function (m) {
      $('#movie-form-title').text('Edit Movie');
      var form = $('#form-movie');
      form.find('[name=id]').val(m.id);
      form.find('[name=title]').val(m.title);
      form.find('[name=release_date]').val(m.release_date || '');
      form.find('[name=genre]').val(m.genre);
      form.find('[name=director]').val(m.director);
      form.find('[name=actors]').val(m.actors);
      form.find('[name=description]').val(m.description);
      form.find('[name=poster_url]').val(m.poster_url);
      $('#movie-error').text('');
      openModal('modal-movie');
    });
  });

  $('#form-movie').on('submit', function (e) {
    e.preventDefault();
    var form = $(this);
    var id = form.find('[name=id]').val();
    var payload = {
      title: form.find('[name=title]').val(),
      release_date: form.find('[name=release_date]').val() || null,
      genre: form.find('[name=genre]').val(),
      director: form.find('[name=director]').val(),
      actors: form.find('[name=actors]').val(),
      description: form.find('[name=description]').val(),
      poster_url: form.find('[name=poster_url]').val()
    };

    var url = id ? '/api/movies/' + id : '/api/movies';
    var method = id ? 'PUT' : 'POST';

    $.ajax({
      url: url, method: method, contentType: 'application/json', data: JSON.stringify(payload)
    }).done(function () {
      closeModal('modal-movie');
      toast(id ? 'Movie updated.' : 'Movie added.');
      fetchMovies();
      fetchGenres();
      if ($('#page-admin').is(':visible')) fetchAdminMovies();
    }).fail(function (xhr) {
      $('#movie-error').text(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to save movie.');
    });
  });

  $(document).on('click', '.btn-delete-movie', function () {
    var id = $(this).data('id');
    if (!confirm('Delete this movie?')) return;
    $.ajax({ url: '/api/movies/' + id, method: 'DELETE' }).done(function () {
      toast('Movie deleted.');
      fetchMovies();
      fetchGenres();
      fetchAdminMovies();
      fetchAdminScreenings();
    });
  });

  // ---- Admin: cinemas ----
  function fetchAdminCinemas() {
    $.get('/api/cinemas').done(function (cinemas) {
      var tbody = $('#admin-cinemas-table tbody').empty();
      cinemas.forEach(function (c) {
        tbody.append('<tr>' +
          '<td>' + c.id + '</td>' +
          '<td>' + escapeHtml(c.name) + '</td>' +
          '<td>' + escapeHtml(c.address || '') + '</td>' +
          '<td>' + escapeHtml(c.city || '') + '</td>' +
          '<td>' +
            '<button class="action-btn btn-edit-cinema" data-id="' + c.id + '">Edit</button>' +
            '<button class="action-btn danger btn-delete-cinema" data-id="' + c.id + '">Delete</button>' +
          '</td>' +
        '</tr>');
      });
      populateCinemaDropdowns(cinemas);
    });
  }

  $('#btn-add-cinema').on('click', function () {
    $('#cinema-form-title').text('Add Cinema');
    $('#form-cinema')[0].reset();
    $('#form-cinema [name=id]').val('');
    $('#form-cinema [name=city]').val('Kraków');
    $('#cinema-error').text('');
    openModal('modal-cinema');
  });

  $(document).on('click', '.btn-edit-cinema', function () {
    var id = $(this).data('id');
    $.get('/api/cinemas/' + id).done(function (c) {
      $('#cinema-form-title').text('Edit Cinema');
      var form = $('#form-cinema');
      form.find('[name=id]').val(c.id);
      form.find('[name=name]').val(c.name);
      form.find('[name=address]').val(c.address);
      form.find('[name=city]').val(c.city);
      $('#cinema-error').text('');
      openModal('modal-cinema');
    });
  });

  $('#form-cinema').on('submit', function (e) {
    e.preventDefault();
    var form = $(this);
    var id = form.find('[name=id]').val();
    var payload = {
      name: form.find('[name=name]').val(),
      address: form.find('[name=address]').val(),
      city: form.find('[name=city]').val()
    };
    var url = id ? '/api/cinemas/' + id : '/api/cinemas';
    var method = id ? 'PUT' : 'POST';

    $.ajax({
      url: url, method: method, contentType: 'application/json', data: JSON.stringify(payload)
    }).done(function () {
      closeModal('modal-cinema');
      toast(id ? 'Cinema updated.' : 'Cinema added.');
      fetchAdminCinemas();
    }).fail(function (xhr) {
      $('#cinema-error').text(xhr.responseJSON ? xhr.responseJSON.error : 'Failed.');
    });
  });

  $(document).on('click', '.btn-delete-cinema', function () {
    var id = $(this).data('id');
    if (!confirm('Delete this cinema? All its screenings will also be removed.')) return;
    $.ajax({ url: '/api/cinemas/' + id, method: 'DELETE' }).done(function () {
      toast('Cinema deleted.');
      fetchAdminCinemas();
      fetchAdminScreenings();
    });
  });

  // ---- Admin: screenings ----
  function fetchAdminScreenings() {
    $.get('/api/screenings').done(function (list) {
      var tbody = $('#admin-screenings-table tbody').empty();
      list.forEach(function (s) {
        tbody.append('<tr>' +
          '<td>' + s.id + '</td>' +
          '<td>' + escapeHtml(s.movie_title) + '</td>' +
          '<td>' + escapeHtml(s.cinema_name) + '</td>' +
          '<td>' + formatScreening(s.screening_time) + '</td>' +
          '<td>' + escapeHtml(s.hall || '') + '</td>' +
          '<td>' +
            '<button class="action-btn btn-edit-screening" data-id="' + s.id + '">Edit</button>' +
            '<button class="action-btn danger btn-delete-screening" data-id="' + s.id + '">Delete</button>' +
          '</td>' +
        '</tr>');
      });
    });
  }

  $('#btn-add-screening').on('click', function () {
    $('#screening-form-title').text('Add Screening');
    $('#form-screening')[0].reset();
    $('#form-screening [name=id]').val('');
    $('#screening-error').text('');
    populateMovieDropdown();
    openModal('modal-screening');
  });

  $(document).on('click', '.btn-edit-screening', function () {
    var id = $(this).data('id');
    populateMovieDropdown();
    $.get('/api/screenings/' + id).done(function (s) {
      $('#screening-form-title').text('Edit Screening');
      var form = $('#form-screening');
      form.find('[name=id]').val(s.id);
      form.find('[name=movie_id]').val(s.movie_id);
      form.find('[name=cinema_id]').val(s.cinema_id);
      form.find('[name=screening_time]').val(s.screening_time.replace(' ', 'T').slice(0, 16));
      form.find('[name=hall]').val(s.hall || '');
      $('#screening-error').text('');
      openModal('modal-screening');
    });
  });

  $('#form-screening').on('submit', function (e) {
    e.preventDefault();
    var form = $(this);
    var id = form.find('[name=id]').val();
    var payload = {
      movie_id: Number(form.find('[name=movie_id]').val()),
      cinema_id: Number(form.find('[name=cinema_id]').val()),
      screening_time: form.find('[name=screening_time]').val().replace('T', ' '),
      hall: form.find('[name=hall]').val()
    };
    var url = id ? '/api/screenings/' + id : '/api/screenings';
    var method = id ? 'PUT' : 'POST';

    $.ajax({
      url: url, method: method, contentType: 'application/json', data: JSON.stringify(payload)
    }).done(function () {
      closeModal('modal-screening');
      toast(id ? 'Screening updated.' : 'Screening added.');
      fetchAdminScreenings();
    }).fail(function (xhr) {
      $('#screening-error').text(xhr.responseJSON ? xhr.responseJSON.error : 'Failed.');
    });
  });

  $(document).on('click', '.btn-delete-screening', function () {
    var id = $(this).data('id');
    if (!confirm('Delete this screening?')) return;
    $.ajax({ url: '/api/screenings/' + id, method: 'DELETE' }).done(function () {
      toast('Screening deleted.');
      fetchAdminScreenings();
    });
  });

  // init
  fetchGenres();
  fetchAllCinemas();
  fetchSession();

});
