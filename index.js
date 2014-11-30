var core = require("gezi-core");
var parallel = require("parallelly");
var start = require("./lib/start");
var search = require("./lib/search");
var frames = require("./lib/frames");

up();

function up () {
//  core.history.reset(function () {
    parallel()
      .run(core.history.init)
      .and(core.urls.init)
      .and(core.keywords.init)
      .and(start)
      .and(search.init)
      .and(frames.init)
      .done(function () {
        console.log('up now');
      });
//});
}
