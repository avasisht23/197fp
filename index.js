var express = require('express')
var bodyParser = require('body-parser')
var cookieSession = require('cookie-session')
var mongoose = require('mongoose')

var app = express();
app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res)) {
  res.send('Hello Youtube')
});

app.get('/webhook', function(req, res)) {
  if(req.query['hub.verify_token'] === ('197fp') {
    res.send(req.query['hub.challenger']);
  }
  res.send('No entry');
});

app.listen(process.env.PORT || 5000, function () {
  console.log('App listening on port ' + app.get('port'))
})
