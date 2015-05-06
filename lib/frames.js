var core = require("gezi-core");
var generateTitle = require("title-from-url");
var generateTags = require("meta-tags");
var pubsub = require("pubsub");
var ui = require("./ui");
var events = require("./events");

var frames = {};
var counter = 0;
var selected;

module.exports = {
  init: init,
  frames: frames,
  add: add,
  selected: getSelected,
  select: select,
  open: open,
  navigate: navigate,
  kill: kill
};

function init (callback) {
  events.select(function (id) {
    if (frames[id]) {
      return select(frames[id]);
    }

    core.frames.get(id, function (error, frame) {
      if (error) {
        return console.error('Unrecognized history record: %s', id);
      }

      core.frames.touch(id);
    });
  });

  callback();
}

function add (id, url) {
  var index = ++counter;

  var frame = {
    id: id,
    index: index,
    url: url,
    title: generateTitle(url),
    onLoad: pubsub(),
    onNavigate: pubsub()
  };

  frame.element = ui.newFrame(index, url, watch(frame));
  frame.element.contentWindow && ui.setupFrame(frame.element.contentWindow);

  frames[frame.id] = frame;

  return frame;
}

function open (url, callback) {
  core.frames.open(url, function (error, frameId) {
    if (error) return callback(error);

    if (frames[frameId]) {
      select(frames[frameId]);
      return callback(undefined, frames[frameId]);
    }

    var frame = add(frameId, url);
    select(frame);

    callback(undefined, frame);
  });
}

function navigate (frame, url, callback) {

}

function getSelected () {
  return selected;
}

function select (frame) {
  if (selected) ui.hideFrame(selected);
  ui.showFrame(frame);
  selected = frame;

  core.frames.touch(frame.id, function (error) {
    if (error) throw error;
  });
}

function kill (frame, callback) {
  delete frames[frame.id];

  if (frame.element && frame.element.parentNode) frame.element.parentNode.removeElement(frame.element);

  core.frames.get(frame.id, function (error, frame) {
    if (error || !frame) return;

    core.frames.kill(frame.id, function (error) {
      console.log('Frame #%d (%s) got killed. Error: %s', frame.id, frame.url, error);

      if (callback) return callback(error);

      throw error;
    });
  });
}

function watch (frame) {
  return function () {
    var url = frame.element[0].contentWindow.document.location.href;
    var navigating = core.urls.simplify(url) != core.urls.simplify(frame.url);
    var loaded = frame.loaded;
    var contentWindow = frame.element[0].contentWindow;

    frame.url = url;
    frame.title = contentWindow.document.title || generateTitle(frame.url);
    frame.tags = generateTags(contentWindow);
    frame.loaded = true;

    ui.setupFrame(contentWindow);

    if (navigating) {
      frame.onNavigate.publish();

      core.frames.navigate(frame.id, url, function (error, id) {
        if (id == frame.id) return;
        if (!frames[id]) {
          throw new Error('Navigation can not fallback to unexisting frame #' + id);
        }

        select(frames[id]);
        kill(frame);
      });
    }

    frame.onLoad.publish();
  };
}
