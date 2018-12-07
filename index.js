var express = require('express')
var bodyParser = require('body-parser')
var cookieSession = require('cookie-session')
var mongoose = require('mongoose')

var app = express();

const token = process.env.FB_VERIFY_TOKEN;
const access = process.env.FB_ACCESS_TOKEN;

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('Hello Youtube')
});

app.get('/webhook/', function(req, res) {
  if(req.query['hub.verify_token'] === token) {
    res.send(req.query['hub.challenge']);
  }
  res.send('No entry');
});

app.post('/webhook/', function(req, res) {
  var messenging_events = req.body.entry[0].messaging_events;
  for (var i = 0; i < messaging_events.length; i++) {
    var event = messaging_events[i];
    var sender = event.sender.id;
    if (event.message && event.message.text) {
      var text = event.message.text;
      sendText(sender, "Text echo: ", text.substring(0, 100))
    }
  }
});

function sendText(sender, text) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access, token},
    method: 'POST',
    json: {
      recipient : {id: sender},
      message : messageData
    }
  }, function(err, response, body) {
    if (err) {
      console.log("sending error", err);
    } else if (response.body.error) {
      console.log("respond body error", response.body.error);
    }
  });
}

app.listen(process.env.PORT || 5000, function () {
  console.log('App listening on port ' + app.get('port'))
});
