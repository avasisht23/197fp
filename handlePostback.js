var express = require('express')
var bodyParser = require('body-parser')
var cookieSession = require('cookie-session')
var mongoose = require('mongoose')
var request = require('request')
var app = express();

var sendBack = require('./callSendApi.js');

var token = process.env.FB_VERIFY_TOKEN;
var access = process.env.FB_ACCESS_TOKEN;

var handlePostback = function(userInfo, sender_psid, received_postback) {
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
  } else if (payload === 'Add Todo!') {
    response = { "text": "Send me a group id to add todo" }
    userInfo[sender_psid].wantsToAddTodos = true;
    console.log("wants to add todos", userInfo[sender_psid])
  } else if (payload === 'Get Todos!') {
    response = { "text": "Send me a group id from which to get todos" }
    userInfo[sender_psid].wantsToGetTodos = true;
    console.log("wants to get todos", userInfo[sender_psid])
  }
  // Send the message to acknowledge the postback
  sendBack.callSendAPI(sender_psid, response);
}

var handlePB = {
  handlePostback: handlePostback
};

module.exports = handlePB;
