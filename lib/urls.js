var lessCommonWords = require("less-common-words");
var now = require("unique-now");
var settings = require("./settings");
var db = require("./db");
var initialized;

module.exports = {
  init: init,
  clean: clean,
  simplify: simplify,
  keywords: keywords,
  save: save,
  get: get,
  reset: reset
};

function save (url, options, callback) {
  var id;
  url = simplify(url);

  get(url, function (error, record) {
    if (error || !record) {
      id = now();
      db.query('INSERT INTO urls (id, url, title) VALUES (?, ?, ?)', [id, url, options.title], callback);
      return;
    }

    db.query('UPDATE urls SET title=? WHERE id=?', [options.title, record.id], callback);
  });
}

function get (url, callback) {
  db.oneRow('SELECT * FROM urls WHERE url=?', [simplify(url)], callback);
}

function keywords (url) {
  url = simplify(url);
  url = url.replace(/\.\w+(\/|$|\?|\#)/, '$1');
  return lessCommonWords(url);
}

function clean (url) {
  return url.toLowerCase()
    .replace(/\/$/, '')
    .replace(/\#$/, '')
    .replace(/\?$/, '')
    .replace(/\/\#/, '');
}

function simplify (url) {
  return clean(url).replace(/^\w+:\/\//, '').replace(/^www\./, '');
}

function init (callback) {
  if (initialized) return callback();

  initialized = true;

  db.query('CREATE TABLE IF NOT EXISTS urls (id integer primary key asc, url text unique, title text)', callback);
}

function reset (callback) {
  db.query('DROP TABLE urls', function (err) {
    if (err) return callback(err);
    initialized = false;
    init(callback);
  });
}
