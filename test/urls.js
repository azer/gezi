var test = require("prova");
var urls = require("../lib/urls");

test('saving basic url info', function (t) {
  t.plan(4);

  var url = 'http://en.wikipedia.org/wiki/gezi?';
  var options = {
    title: 'Taksim Gezi Park - Wikipedia, the free encyclopedia'
  };

  urls.reset(function (error) {
    t.error(error);

    urls.save(url, options, function (error) {
      t.error(error);

      urls.get('asdf://en.wikipedia.org/wiki/Gezi', function (error, record) {
        t.error(error);
        t.equal(record.title, options.title);
      });
    });
  });
});

test('avoiding duplicate urls', function (t) {
  t.plan(5);

  urls.get('en.wikipedia.org/wiki/gezi', function (error, record) {
    t.error(error);

    urls.save('x://en.wikipedia.org/wiki/gezi#', { title: 'yo' }, function (error) {
      t.error(error);

      urls.get('https://en.wikipedia.org/wiki/Gezi', function (error, copy) {
        t.error(error);
        t.equal(record.id, copy.id);
        t.equal(copy.title, 'yo');
      });
    });
  });
});
