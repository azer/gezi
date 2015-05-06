var task = require("bud");
var rmrf = require("rm-rf");
var browserify = require("browserify");
var fs = require("fs");
var style = require("style-format");
var leftpad = require("left-pad");
var exec = require("child_process").exec;
var build = task;

task('default', task.once('dist'));

task('open', function (t) {
  t.exec('open -n -a node-webkit .').then(t.done);
});

build('dist', build.watch('index.js', 'lib', 'ui', '../gezi-core/lib'), function (b){
  browserify('./index.js').bundle().pipe(build.write('dist/gezi.js'));
});

task('clean', function (t) {
  rmrf('dist', t.done);
});

task('show', function (t) {
  var line = parseInt(t.params.line);
  var lines = fs.readFileSync('dist/gezi.js').toString().split('\n').slice(line - 5, line + 4);

  console.log('');

  lines.forEach(function (code, ind) {
    var lineno = leftpad(line - 4 + ind, String(line).length);

    if (ind + line - 4 == line) {
      console.log(style('    {bold}%s. {white}%s{reset}'), lineno, code);
      return;
    }


    console.log(style('    {grey}%s. %s{reset}'), lineno, code);
  });

  console.log('');
});

function restart () {
  exec('ps aux', function (error, stdout) {
    if (error) return console.error(error);

    var rows = stdout.split('\n').filter(function (line) {
      return line.indexOf('node-webkit.app') > -1;
    });

    if (!rows.length) return;

    var pid = rows[0].split(/\s+/)[1];

    exec('kill -9 ' + pid, function () {
      exec('open -n -a node-webkit .');
    });
  });
}
