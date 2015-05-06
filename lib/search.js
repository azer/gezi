var core = require("gezi-core");
var loop = require("parallel-loop");
var generateTitle = require("title-from-url");
var ui = require("./ui");
var events = require("./events");
var frames = require("./frames");

module.exports = {
  init: init,
  search: search,
  listOpenFrames: listOpenFrames
};

function init (callback) {
  listOpenFrames(callback);
  events.showSearch(listOpenFrames);
}

function search () {

}

function listOpenFrames (callback) {
  core.frames.all(function (error, openFrames) {
    if (error) return callback && callback(error);
    if (!openFrames) return callback && callback();

    loop(openFrames.length, each, function (errors) {
      if (errors) return callback(errors[0]);

      ui.filterOpenPages(openFrames);

      callback && callback();
    });

    function each (done, index) {
      core.urls.get(openFrames[index].url, function (error, url) {
        if (error) return done(error);

        var id;
        var title;

        if (!url) {
          console.log('%s doesnt have url record', openFrames[index].url);
          title = generateTitle(openFrames[index].url);
        } else {
          title = url.title;
        }

        if (frames.open[openFrames[index].id]) {
          openFrames[index].frame = frames.open[openFrames[index].id].index;
        }

        openFrames[index].id = id;
        openFrames[index].title = title;

        done();
      });
    }

  });
}
