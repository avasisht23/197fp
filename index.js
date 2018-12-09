var express = require('express')
var bodyParser = require('body-parser')
var cookieSession = require('cookie-session')
var mongoose = require('mongoose')
var request = require('request')
var app = express();

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
          wantsToLeaveGroup: false,
          wantsToAddTodos: false,
          wantsToGetTodos: false
        }
      }

      console.log("Users", userInfo[sender_psid])
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function handleMessage(sender_psid, received_message) {
  let response;
  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    if (received_message.text === "Hello")
    // response = {
    //   "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
    // }
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Welcome!",
            "subtitle": "Select what you'd like to do...",
            //"image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Create Group!",
                "payload": "Create Group!",
              },
              {
                "type": "postback",
                "title": "Join Group!",
                "payload": "Join Group!",
              }
            ],
          }]
        }
      }
    }
    if (userInfo[sender_psid].wantsToCreateGroup) {
      var groupID = received_message.text;
      var dbQ = new Group({ id: groupID, owner: sender_psid, members: [sender_psid] })
      dbQ.save(function (err, result) {
        if (!err) {
          console.log("created group!")
        } else {
          next(err);
        }
      })
      userInfo[sender_psid].wantsToCreateGroup = false;
      response = {
        "text": `You have created group: "${received_message.text}". Add a todo or Check todos!`
      }
    }
    if (userInfo[sender_psid].wantsToJoinGroup) {
      var groupID = received_message.text;
      var questionDb = Group.findOneAndUpdate({ "id" : groupID }, { $pop: { "members" : sender_psid } }, function (err, results) {
        if (!err) {
            console.log("joined group!")
        } else {
            console.log(err);
        }
      })

      userInfo[sender_psid].wantsToJoinGroup = false;
      response = {
        "text": `You have joined group: "${received_message.text}". Add a todo or Check todos!`
      }
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            //"image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Create Group!",
                "payload": "Create Group!",
              },
              {
                "type": "postback",
                "title": "Join Group!",
                "payload": "Join Group!",
              }
            ],
          }]
        }
      }
    }
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_postback) {
  let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'Create Group!') {
    response = { "text": "Give me a group id!" }
    userInfo[sender_psid].wantsToCreateGroup = true;
    console.log("wants to create", userInfo[sender_psid])
  } else if (payload === 'Join Group!') {
    response = { "text": "What is the group id?" }
    userInfo[sender_psid].wantsToJoinGroup = true;
    console.log("wants to join", userInfo[sender_psid])
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": access },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

app.listen(process.env.PORT || 5000, function () {
  console.log('App listening on port ' + app.get('port'))
});
