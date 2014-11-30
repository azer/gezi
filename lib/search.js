var core = require("gezi-core");
var loop = require("parallel-loop");
var generateTitle = require("title-from-url");
var ui = require("./ui");
var events = require("./events");
var frames = require("./frames");

module.exports = {
  init: init,
  search: search,
  listOpenPages: listOpenPages
};

function init (callback) {
  listOpenPages(callback);
  events.showSearch(listOpenPages);
}

function search () {

}

function listOpenPages (callback) {
  core.history.activeVisits(function (error, openPages) {
    if (error) return callback && callback(error);
    if (!openPages) return callback && callback();

    loop(openPages.length, each, function (errors) {
      if (errors) return callback(errors[0]);

      ui.filterOpenPages(openPages);

      callback && callback();
    });

    function each (done, index) {
      core.urls.get(openPages[index].url, function (error, url) {
        if (error) return done(error);

        var id;
        var title;

        if (!url) {
          console.log('%s doesnt have url record', openPages[index].url);
          title = generateTitle(openPages[index].url);
        } else {
          title = url.title;
        }

        if (frames.open[openPages[index].id]) {
          openPages[index].frame = frames.open[openPages[index].id].index;
        }

        openPages[index].id = id;
        openPages[index].title = title;

        done();
      });
    }

  });
}
