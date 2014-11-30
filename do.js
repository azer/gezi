var task = require("bud");
var rmrf = require("rm-rf");
var browserify = require("browserify");
var build = task;

task('default', task.once('dist'));

build('dist', build.watch('index.js', 'lib', 'ui'), function (b){
  browserify('./index.js').bundle().pipe(build.write('dist/gezi.js'));
});

task('clean', function (t) {
  rmrf('dist', t.done);
});
