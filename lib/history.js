var now = require("unique-now");
var parallel = require("parallelly");
var db = require('./db');
var urls = require("./urls");
var initialized;

module.exports = {
  reset: reset,
  init: init,
  visit: visit,
  open: open,
  close: close,
  get: get,
  activeUrls: activeUrls
};

function visit (url, callback) {
  url = urls.clean(url);

  get(url, function (error, record) {
    if (record) {
      return visitAgain(record.id, callback);
    }

    visitFirstTime(url, callback);
  });
}

function visitFirstTime (url, callback) {
  var id = now();
  var sql = 'INSERT INTO history (id, url, ts) VALUES (?, ?, ?)';

  parallel()
    .run(db.query, [sql, [id, url, Date.now()]])
    .and(open, [id])
    .done(function (errors) {
      if (errors) return callback(errors[0]);
      callback(undefined, id);
    });
}

function visitAgain (id, callback) {
  var sql = 'UPDATE history SET ts=? WHERE id=?';

  parallel()
    .run(db.query, [sql, [Date.now(), id]])
    .and(open, [id])
    .done(function (errors) {
      if (errors) return callback(errors[0]);
      callback(undefined, id);
    });
}

function open (url, callback) {
  var id = now();

  db.query('INSERT INTO active (id, url) VALUES (?, ?)', [id, url], function (error) {
    if (error) return callback(error);

    callback(undefined, id);
  });
}

function close (id, callback) {
  db.query('DELETE FROM active WHERE id = ?', [id], callback);
}

function get (url, callback) {
  db.oneRow('SELECT * FROM history WHERE url=?', [urls.clean(url)], callback);
}

function activeUrls (callback) {
  db.query('SELECT * FROM active', callback);
}

function init (callback) {
  if (initialized) return callback();

  initialized = true;

  parallel()
    .run(db.query, ['CREATE TABLE IF NOT EXISTS history (id integer primary key asc, url text unique, ts integer)'])
    .and(db.query, ['CREATE TABLE IF NOT EXISTS active (id integer primary key asc, url integer unique)'])
    .done(callback);
}

function reset (callback) {
  db.query('DROP TABLE IF EXISTS history', function (err) {
    if (err) return callback(err);

    db.query('DROP TABLE IF EXISTS active', function (err) {
      if (err) return callback(err);

      initialized = false;
      init(callback);
    });
  });
}
