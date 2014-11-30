var core = require("gezi-core");
var ui = require("./ui");
var browse = require("./browse");
var events = require("./events");

module.exports = start;

function start (callback) {
  ui.init();
  startBrowsing(callback);

  events.navigate(function (input) {
    console.log('navigate to %s', input);

    browse(input, function () {
      console.log('done');
    });
  });
}

function startBrowsing (callback) {
  core.history.activeUrls(function (error, urls) {
    if (error || !urls || !urls.length) {
      return welcome(callback);
    }

    core.history.getById(urls[0].url, function (error, visit) {
      if (error || !visit) {
        return welcome(callback);
      }

      browse(visit.url, callback);
    });
  });
}

function welcome (callback) {
  browse('http://google.com', callback);
}
