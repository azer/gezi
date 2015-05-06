var core = require("gezi-core");
var frames = require("./frames");
var events = require("./events");

module.exports = browse;

function browse (input, callback) {
  if (search(input, callback)) return;

  var url = normalize(input);

  frames.open(url, function (error, frame) {
    frame.onLoad(onLoad);
    frame.onNavigate(onNavigate);
    events.load.publish(frame);

    function onLoad () {
      core.urls.save(frame.url, frame, function () {
        console.log('Saved url: %s', url, frame);
      });

      core.keywords.save(frame.url, frame, function () {
        console.log('Saved keywords: %s', url, frame);
      });

      events.load.publish(frame);
    }

    function onNavigate () {
      core.history.visit(frame.url, function (error, id) {
        if (error) throw error;

        console.log('Added %s to history', frame.url, frame);

        events.load.publish(frame);
      });
    }
  });
}

function search (text) {

}

function normalize (url) {
  if (/^http\w?\:\/\//.test(url)) return url;
  return 'http://' + url;
}
