var test = require("prova");
var history = require("../lib/history");

test('visiting a site', function (t) {
  t.plan(6);

  history.reset(function (error) {
    t.error(error);

    var now = Date.now();

    history.visit('http://en.wikipedia.org/wiki/foo?', function (error, id) {
      t.error(error);

      // should create a record on history
      history.get('http://en.wikipedia.org/wiki/foo', function (error, record) {
        t.error(error);
        t.equal(record.id, id);
        t.equal(record.url, 'http://en.wikipedia.org/wiki/foo');
        t.ok(record.ts >= now);
      });

    });
  });
});

test('active urls', function (t) {
  t.plan(3);

  history.get('http://en.wikipedia.org/wiki/foo#', function (error, wiki) {
    // should be in active urls table
    history.activeUrls(function (error, result) {
      t.error(error);
      t.equal(result.length, 1);
      t.equal(result[0].url, wiki.id);
    });
  });
});

test('closing an active url', function (t) {
  t.plan(5);

  history.activeUrls(function (error, result) {
    t.error(error);
    t.equal(result.length, 1);

    history.close(result[0].id, function (error) {
      t.error(error);

      history.activeUrls(function (error, result) {
        t.error(error);
        t.notOk(result);
      });
    });
  });
});
