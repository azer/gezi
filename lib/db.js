var db;

module.exports = {
  init: init,
  query: query,
  oneRow: oneRow
};

function init () {
  db = openDatabase('gezi', '1.0', 'Gezi Browser History', 2 * 1024 * 1024);
}

function query (sql, params, callback) {
  if (!db) init();

  if (arguments.length == 2) {
    callback = params;
    params = undefined;
  }

  params || (params = []);

  db.transaction(function (tx) {
    console.log('Query: %s', sql, params);
    tx.executeSql(sql, params, onSuccess, onError);
  });

  function onSuccess (_, result) {
    if (!callback) return;
    if (!result) return callback();
    if (!result.rows.length) return callback();

    var rows = [];
    var i = -1;
    var len = result.rows.length;

    while (++i < len) {
      rows.push(result.rows.item(i));
    }

    callback(undefined, rows);
  }

  function onError (_, err) {
    callback(err);
  }
}

function oneRow (sql, params, callback) {
  if (arguments.length == 2) {
    callback = params;
    params = undefined;
  }

  query(sql, params, function (error, rows) {
    if (error) return callback(error);

    callback(undefined, rows && rows[0]);
  });
}
