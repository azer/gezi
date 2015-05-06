var core = require("gezi-core");
var parallel = require("parallelly");
var start = require("./lib/start");
var search = require("./lib/search");
var frames = require("./lib/frames");
var ui = require("./lib/ui");

//up();
core.reset(up);

function up () {
  parallel()
    .run(core.frames.init)
    .and(core.history.init)
    .and(core.urls.init)
    .and(core.keywords.init)
    .and(ui.init)
    .and(search.init)
    .and(frames.init)
    .done(ready);
}

function ready () {
  start(function () {
    console.log('ready.');
  });
}
