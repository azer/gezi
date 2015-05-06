var core = require("gezi-core");
var ui = require("./ui");
var browse = require("./browse");
var events = require("./events");
var frames = require("./frames");

module.exports = start;

function start (callback) {
  startBrowsing(callback);

  events.navigate(function (input) {
    console.log('navigate to %s', input);

    browse(input, function () {
      console.log('done');
    });
  });
}

function startBrowsing (callback) {
  console.log('start');
  core.frames.all(function (error, frames) {
    console.log('all', frames);
    if (error || !frames || !frames.length) {
      return welcome(callback);
    }

    recover(frames, callback);
  });
}

function welcome (callback) {
  browse('http://google.com', callback);
}

function recover (rows, callback) {
  var i = -1;
  var len = rows.length;

  while (++i < len) {
    frames.add(rows[i].id, rows[i].url);
  }

  return rows;
}
