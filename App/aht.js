var exec = require('child_process').exec;

module.exports.execute = function(command, cb) {
  var results = [];
  var aht = exec('~/Support-Tools/bin/aht ' + command);

  aht.stdout.setEncoding('utf8');

  aht.stdout.on('data', function (chunk) {
    results.push(chunk);
  });

  aht.stdout.on('end', function () {
    cb(results.join());
  });
}