var express = require('express'),
    expressLayouts = require('express-ejs-layouts'),
    app = express();

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  var exec = require('child_process').exec;
  var results = [];
  var aht = exec('~/Support-Tools/bin/aht');

  aht.stdout.setEncoding('utf8');

  aht.stdout.on('data', function (chunk) {
    results.push(chunk);
  });

  aht.stdout.on('end', function () {
    var ahtResults = results.join();

    if (!ahtResults || ahtResults.indexOf('AHTools Version') === -1) {
      res.render('whoops', { error: 'Cannot connect to AHT', description: 'The bastion connection may not be active, or the aht binary cannot be located.  Type "bastion" in a terminal window and ensure aht is located at ~/Support-Tools/bin/aht' });
    } else {
      res.render('index', { version: ahtResults });
    }
  });
});

app.get('/find', function(req, res){
  var exec = require('child_process').exec;
  var results = [];
  var aht;

  if (req.param('domain')) {
    aht = exec('~/Support-Tools/bin/aht fd ' + req.param('domain'));
  } else if (req.param('docroot')) {
    aht = exec('~/Support-Tools/bin/aht @' + req.param('docroot'));
  } else if (req.param('server')) {
    aht = exec('~/Support-Tools/bin/aht server ' + req.param('server'));
  } else {
    res.send(403, 'need search params')
  }

  aht.stdout.setEncoding('utf8');

  aht.stdout.on('data', function (chunk) {
    results.push(chunk);
  });

  aht.stdout.on('end', function () {
    res.send(200,results.join());
  });
});

app.listen(47051);