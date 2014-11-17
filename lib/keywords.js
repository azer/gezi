var lessCommonWords = require("less-common-words");
var now = require("unique-now");
var loop = require("parallel-loop");
var uniques = require("uniques");
var db = require('./db');
var urls = require("./urls");
var initialized;

module.exports = {
  init: init,
  save: save,
  add: add,
  search: search,
  reset: reset,
  getKeywords: getKeywords
};

function save (url, options, callback) {
  url = urls.simplify(url);

  if (arguments.length < 3) {
    callback = options;
    options = {};
  }

  var keywords = urls.keywords(url);
  options.title && (keywords = keywords.concat(lessCommonWords(options.title)));
  options.tags && (keywords = keywords.concat(options.tags));

  keywords = uniques(keywords);

  loop(keywords.length, each, callback);

  function each (done, index) {
    add(keywords[index], url, done);
  }
}

function add (keyword, url, callback) {
  db.oneRow('SELECT * FROM keywords WHERE url=? AND keyword=?', [url, keyword], function (error, record) {
    if (record) return callback();

    db.query('INSERT INTO keywords (id, keyword, url) VALUES (?, ?, ?)', [now(), keyword, url], callback);
  });
}

function search (keyword, callback) {
  db.query('SELECT * FROM keywords WHERE keyword=?', [keyword], callback);
}

function getKeywords (url, callback) {
  db.query('SELECT * from keywords WHERE url=?', [urls.simplify(url)], callback);
}

function init (callback) {
  db.query('CREATE TABLE IF NOT EXISTS keywords (id integer primary key asc, keyword text, url string)', callback);
}

function reset (callback) {
  db.query('DROP TABLE IF EXISTS keywords', function (err) {
    if (err) return callback(err);
    initialized = false;
    init(callback);
  });
}
