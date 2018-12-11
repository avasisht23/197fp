var express = require('express')
var bodyParser = require('body-parser')
var cookieSession = require('cookie-session')
var mongoose = require('mongoose')
var request = require('request')
var app = express();

var sendBack = require('./handlers/callSendApi.js');
var handlePB = require('./handlers/handlePostback.js');
var handleMSG = require('./handlers/handleMessage.js');

var userInfo = [];

var Group = require('./models/groups');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/197fp')

var token = process.env.FB_VERIFY_TOKEN;
var access = process.env.FB_ACCESS_TOKEN;

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

app.post('/webhook', (req, res) => {
  console.log("webhook data", req.body)
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      if (!userInfo[sender_psid]) {
        userInfo[sender_psid] = {
          wantsToCreateGroup: false,
          wantsToJoinGroup: false,
          wantsToAddTodo: false,
          todoGroupWasGiven: '',
          todoWasGiven: '',
          wantsToGetTodos: false
        }
      }

      console.log("Users", userInfo[sender_psid])
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMSG.handleMessage(userInfo, sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePB.handlePostback(userInfo, sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

app.listen(process.env.PORT || 5000, function () {
  console.log('App listening on port ' + app.get('port'))
});
