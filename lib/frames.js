var core = require("gezi-core");
var generateTitle = require("title-from-url");
var generateTags = require("meta-tags");
var pubsub = require("pubsub");
var ui = require("./ui");
var events = require("./events");

var open = {};
var counter = 0;
var selected;

module.exports = {
  init: init,
  open: open,
  add: add,
  selected: getSelected,
  select: select
};

function init () {
  events.select(function (id) {
    if (open[id]) {
      return select(open[id]);
    }

    core.history.getById(id, function (error, visit) {
      if (error) {
        return console.error('Unrecognized history record: %s', id);
      }

      events.navigate.publish(visit.url);
    });

  });
}

function add (url, callback) {
  var index = ++counter;

  var frame = {
    id: undefined,
    index: index,
    url: url,
    title: generateTitle(url),
    onLoad: pubsub(),
    onNavigate: pubsub()
  };

  frame.element = ui.newFrame(index, url, watch(frame));
  frame.element.contentWindow && ui.setupFrame(frame.element.contentWindow);

  return frame;
}

function getSelected () {
  return selected;
}

function select (frame) {
  if (selected) ui.hideFrame(selected);
  ui.showFrame(frame);
  selected = frame;
}

function close (frame, callback) {
  core.history.endVisit(frame.id, function (error) {
    callback && callback(error);

    if (error) {
      console.error(error);
    }
  });
}

function watch (frame) {
  return function () {
    var url = frame.element[0].contentWindow.document.location.href;
    var navigate = url != frame.url;
    var loaded = frame.loaded;
    var contentWindow = frame.element[0].contentWindow;

    if (navigate) {
      close(frame);
    }

    frame.url = url;
    frame.title = contentWindow.document.title || generateTitle(frame.url);
    frame.tags = generateTags(contentWindow);
    frame.loaded = true;

    ui.setupFrame(contentWindow);

    if (navigate) {
      frame.onNavigate.publish();
    }

    if (!loaded) {
      frame.onLoad.publish();
    }
  };
}
