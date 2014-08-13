var fs = require("fs");

var format = require("format-text");
var input = dom('.input');
var searchUI = dom('.search');
var overlay = dom('.overlay');

var frames = {};
var frameCounter = 1;
var history = loadHistory();
var keywords = loadKeywords();
var current;
var isSearchUIOpen;

setup();

function browse (url) {
  if (google(url)) return;
  if (alreadyOpen(url)) return closeSearchUI();
  if (!/^http\w?\:\/\//.test(url)) url = 'http://' + url;

  closeSearchUI();

  var id = 'frame-' + frameCounter++;
  var frame = frames[id] = {};

  frame.id = id;
  frame.el = dom('<iframe id="frame-{1}" class="frame" src="{0}" />', url, id).insert('.frames');
  frame.url = url;

  history[url] = {
    url: url,
    title: url
  };

  switchTo(frame);
  input.value(cleanURL(current.url));

  frame.el.on('load', update);
  frame.el.on('DOMContentLoaded', update);
  dom(frame.el[0].contentWindow).on('DOMContentLoaded', update);
  frame.el[0].contentWindow.addEventListener('hashchange', update, false);

  setupFrame(frame.el[0].contentWindow);
  updatePrompt();
  setTitle('Loading ' + cleanURL(frame.url) + '...');

  function update () {
    var url = frame.el[0].contentWindow.document.location.href;
    var title = frame.el[0].contentWindow.document.title || "(Untitled Document)";

    if (current == frame) setTitle(title);
    setupFrame(frame.el[0].contentWindow);
    frame.url = url;
    frame.title = title;
    updatePrompt();

    history[url] = {
      url: url,
      title: title
    };

    saveKeywords(url, frame);
    saveHistory();
  }
}

function updatePrompt () {
  dom('.input').value(cleanURL(current.url));
}

function setupFrame (frame) {
  dom(frame).onKey('ctrl enter', function (event) {
    event.preventDefault();
    event.stopPropagation();
    openSearchUI();
  });
}

function openSearchUI () {
  overlay.style('display', 'block');
  searchUI.style('display', 'block');

  centerSearchUI();

  input[0].focus();

  isSearchUIOpen = true;
}

function closeSearchUI () {
  overlay.style('display', 'none');
  searchUI.style('display', 'none');
  isSearchUIOpen = false;
}

function searchHistory (keyword, matches, index) {
  if (keyword.length < 3) return;

  var result = [];
  var matchingURLs = keywords[keyword] || [];
  var url;

  for (url in history) {
    if (cleanURL(current.url) == cleanURL(url)) continue;
    if (index[url]) continue;
    if (url.toLowerCase().indexOf(keyword) > -1 || history[url].title.toLowerCase().indexOf(keyword) > -1 || matchingURLs.indexOf(url) > -1) {
      result.push(history[url]);
      index[url] = true;
    }
  }

  matches.push.apply(matches, result.sort(sort));
}

function searchFrames (keyword, matches, index) {
  if (keyword.length < 3) return;

  var matchingURLs = keywords[keyword] || [];
  var result = [];

  var id;
  for (id in frames) {
    if (index[frames[id].url]) continue;
    if (frames[id] == current) continue;

    if (frames[id].url.toLowerCase().indexOf(keyword) > -1 || frames[id].title.toLowerCase().indexOf(keyword) > -1 || matchingURLs.indexOf(frames[id].url) > -1) {
      index[frames[id].url] = true;
      result.push(frames[id]);
    }
  }

  matches.push.apply(matches, result.sort(sort));
}

function search () {
  var _keywords = input.value().toLowerCase().split(' ').map(function (k) {
    return cleanURL(k).toLowerCase();
  });

  var matches = [];
  var index = {};

  if (cleanURL(input.value()) == cleanURL(current.url)) _keywords = [];
  if (_keywords.length == 1 && !_keywords[0]) _keywords = [];

  if (_keywords.length == 0) {
    matches = matches.concat(allFramesByTS());
  }

  _keywords.forEach(function (k) {
    searchFrames(k, matches, index);
  });

  _keywords.forEach(function (k) {
    searchHistory(k, matches, index);
  });

  matches = matches.map(function (item) {
    var frameExtras = ' ';
    if (item.id) {
      frameExtras = ' data-frame="' + item.id + '"';
    }

    return format('<li{frame-extras}data-url="{full-url}" class="item{extra-class}"><span>{title}</span><label>{url}</label><div class="star">&#9733;</div><div class="close">&#x2716;</div></li>', {
      title: shortText((item.title || history[item.url].title).trim(), 50),
      url: shortText(cleanURL(item.url), 26),
      'full-url': item.url,
      'frame-extras': frameExtras,
      'extra-class': item.id ? ' frame' : ''
    });
  });

  dom('.search .results').html(matches.join('\n'));

  centerSearchUI();
}

function cleanURL (url) {
  return url.replace(/^http\w?\:\/\/www\./, '').replace(/^http\:\/\//, '').replace(/\/$/, '');
}

function setTitle (title) {
  window.document.title = title;
}

function shortText (text, len) {
  if (text.length <= len) return text;
  return text.slice(0, Math.floor(len / 2)) + '..' + text.slice(-1 * Math.floor(len/2));
}

function throttle (fn) {
  var timer;
  var args;

  return function () {
    if (timer != undefined) {
      clearTimeout(timer);
      throttle.timer = undefined;
    }

    args = arguments;

    timer = setTimeout(function () {
      fn.apply(undefined, args);
    }, 250);
  };
}

function loadHistory () {
  var doc;

  try {
    return JSON.parse(fs.readFileSync('./history.json').toString());
  } catch (err) {
    return {};
  }
}

function saveHistory () {
  fs.writeFileSync('./history.json', JSON.stringify(history, null, '\t'));
}

function loadFrames () {
  var doc;

  try {
    return JSON.parse(fs.readFileSync('./frames.json').toString());
  } catch (err) {
    return {};
  }
}

function saveFrames () {
  var doc = { urls: [], selected: current.url };
  var key;

  for (key in frames) {
    doc.urls.push(frames[key].url);
  }

  fs.writeFileSync('./frames.json', JSON.stringify(doc), null, '\t');
}

function google (input) {
  if (/http\w?\:\/\//.test(input)) return;
  if (input.indexOf(' ') == -1 && /\w+\.\w+/.test(input)) return;
  browse('https://google.com/search?q=' + input);
  return true;
}

function centerSearchUI () {
  var maxWidth = window.innerWidth;
  var maxHeight = window.innerHeight;

  var width = searchUI[0].offsetWidth;
  var height = searchUI[0].offsetHeight;

  var top = ((maxHeight - height) / 2);
  var left = ((maxWidth - width) / 2);

  if (top < 20) top = 20;
  if (left < 20) left = 20;

  searchUI[0].style.top = top + 'px';
  searchUI[0].style.left = left + 'px';
}

function setup () {
  var resetTo;
  var lastFrames = loadFrames();

  if (lastFrames && lastFrames.urls) {
    lastFrames.urls.forEach(function (url) {
      if (url == lastFrames.selected) return;
      browse(url);
    });

    browse(lastFrames.selected);
  } else {
    browse('http://en.wikipedia.org');
  }

  input.on('keyup', throttle(search));

  input.onKey('enter', function () {
    browse(input.value());
    closeSearchUI();
  });

  dom(window).onKey('esc', closeSearchUI);
  setupFrame(window);

  dom('.search').on('click', 'li span', click);
  dom('.search').on('click', 'li label', click);
  dom('.search').on('click', 'li div', historyEntryToolbar);

  dom('.search').on('mouseover', 'li', function (event) {
    var target = event.target;

    if (target.tagName != "LI") target = target.parentNode;

    if (target.getAttribute('data-frame')) {
      resetTo = current;
      switchTo(frames[target.getAttribute('data-frame')]);
    }
  });

  dom('.search').on('mouseout', 'li', function (event) {
    if (resetTo) switchTo(resetTo);
  });

  function click (event) {
    closeSearchUI();

    resetTo = undefined;

    var target = event.target;

    if (target.tagName != "LI") target = target.parentNode;

    if (target.getAttribute('data-frame')) {
      input.value(cleanURL(current.url));
      return switchTo(frames[target.getAttribute('data-frame')]);
    }

    var url = target.getAttribute('data-url');
    url && browse(url);
  }

}

function alreadyOpen (url) {
  var id;
  var frame;

  url = cleanURL(url);

  for (id in frames) {
    if (cleanURL(frames[id].url) != url) continue;
    frame = frames[id];
    break;
  }

  if (!frame) return;

  if (frame != current) switchTo(frame);

  return true;
}

function switchTo (frame) {
  if (current) {
    current.el.style('display', 'none');
    current = undefined;
  }

  if (!frame) {
    return browse('http://en.wikipedia.org');
  }

  frame.el.style('display', 'block');
  current = frame;

  setTitle(current.title);
  saveFrames();

  frame.ts = +(new Date);
  history[frame.url].ts = +(new Date);
}

function historyEntryToolbar (event) {
  var cls = event.target.getAttribute('class');
  var id = event.target.parentNode.getAttribute('data-frame');
  var frame = frames[id];

  if (cls == "close") kill(frame);
}

function kill (frame) {
  if (current == frame) {
    browse(allFramesByTS()[1].url);
  }

  frame.el.remove();
  delete frames[frame.id];
  search();
  saveFrames();
}

function loadKeywords () {
  var doc;

  try {
    return JSON.parse(fs.readFileSync('./keywords.json').toString());
  } catch (err) {
    return {};
  }
}

function saveKeywords (url, frame) {
  var found = [];

  Array.prototype.slice.call(frame.el[0].contentWindow.document.getElementsByTagName('meta'))
    .filter(function (el) {
      return el.getAttribute('name') == 'keywords';
    })
    .forEach(function (el) {
      found = found.concat(el.getAttribute('content').split(/,\s?/));
    });

  found.forEach(function (k) {
    keywords[k] || (keywords[k] = []);
    if (keywords[k].indexOf(url) > -1) return;
    keywords[k].push(url);
  });

  fs.writeFileSync('./keywords.json', JSON.stringify(keywords, null, '\t'));
}

function sort (a, b) {
  if (!a.ts) return 1;
  if (!b.ts) return -1;
  if (a.ts > b.ts) return -1;
  if (a.ts < b.ts) return 1;
  return 0;
}

function allFramesByTS () {
  var all = [];
  var id;
  for (id in frames) {
    all.push(frames[id]);
  }

  return all.sort(sort);
}
