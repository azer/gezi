var dom = require("domquery");
var events = require("./events");
var input = dom('.input');
var search = dom('.search');
var overlay = dom('.overlay');
var results = dom('.results');

module.exports = {
  init: init,
  newFrame: newFrame,
  hideFrame: hideFrame,
  showFrame: showFrame,
  setupFrame: setupFrame,
  showSearch: showSearch,
  hideSearch: hideSearch,
  filterOpenPages: filterOpenPages
};

function init () {
  input.onKey('enter', function () {
    events.navigate.publish(input.value());
    input.value('');
    hideSearch();
  });

  dom(window).onKey('esc', hideSearch);

  setupFrame(window);

  events.load(function (frame) {
    input.attr('placeholder', frame.url);
    document.title = frame.title + ' - Gezi';
  });

  results.on('click', 'li', function (event) {
    var frameId = event.target.parentNode.dataset.id || event.target.dataset.id;
    events.select.publish(frameId);
    hideSearch();
  });

  console.log('ui initialized');
}

function showSearch () {
  overlay.style('display', 'block');
  search.style('display', 'block');
  input[0].focus();

  events.showSearch.publish();
}

function hideSearch () {
  search.style('display', 'none');
  overlay.style('display', 'none');
}

function newFrame (id, url, callback) {
  var el = dom('<iframe id="frame-{id}" class="frame" src="{url}" />', {
    id: id,
    url: url
  }).insert('.frames');

  setTimeout(function () {
    el.on('load', callback);
  }, 0);

  return el;
}

function filterOpenPages (urls) {
  results.html('');

  var i = -1;
  var len = urls.length;

  while (++i < len) {
    results.add('<li class="item frame" data-frame="{frame}" data-id="{id}"><span>{title}</span><label>{url}</label></li>', {
      title: urls[i].title,
      url: urls[i].url,
      id: urls[i].id,
      frame: urls[i].frame
    });
  }
}

function setupFrame (frame) {
  dom(frame).onKey('ctrl enter', function (event) {
    event.preventDefault();
    event.stopPropagation();
    showSearch();
  });

  dom(frame).onKey('esc', function (event) {
    hideSearch();
  });
}

function hideFrame (frame) {
  frame.element.style('display', 'none');
}

function showFrame (frame) {
  frame.element.style('display', 'block');
}
