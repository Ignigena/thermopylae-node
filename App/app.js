var express = require('express'),
    expressLayouts = require('express-ejs-layouts'),
    app = express(),
    AHT = require('./aht');

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  var results = [];

  AHT.execute('', function (ahtResults) {
    if (!ahtResults || ahtResults.indexOf('AHTools Version') === -1) {
      res.render('whoops', { error: 'Cannot connect to AHT', description: 'The bastion connection may not be active, or the aht binary cannot be located.  Type "bastion" in a terminal window and ensure aht is located at ~/Support-Tools/bin/aht' });
    } else {
      res.render('index', { version: ahtResults });
    }
  });
});

app.get('/find', function(req, res){
  var results = [];
  var command;

  if (req.param('domain')) {
    command = 'fd ' + req.param('domain');
  } else if (req.param('docroot')) {
    command = '@' + req.param('docroot');
  } else if (req.param('server')) {
    command = 'server ' + req.param('server');
  } else {
    res.send(403, 'need search params')
  }

  AHT.execute(command, function (ahtResults) {
    res.send(200, ahtResults);
  });
});

app.get('/contacts', function(req, res) {
  if (!req.param('docroot'))
    return res.send(403, 'need docroot');

  AHT.execute('@' + req.param('docroot') + ' contacts --json', function (ahtResults) {
    res.send(200, ahtResults);
  });
});

app.listen(47051);