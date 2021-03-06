var express = require('express')
var bodyParser = require('body-parser')
var cookieSession = require('cookie-session')
var mongoose = require('mongoose')
var request = require('request')
var app = express();

var sendBack = require('./callSendApi.js');
var Group = require('../models/groups');

var token = process.env.FB_VERIFY_TOKEN;
var access = process.env.FB_ACCESS_TOKEN;

var handleMessage = function(userInfo, sender_psid, received_message) {
  let response;
  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". Say "Hello" to initiate conversation!`
    }
    if (received_message.text === "Hello") {
      initiatePrompts(response, userInfo, sender_psid, received_message);
    }
    else if (userInfo[sender_psid].wantsToCreateGroup) {
      createGroup(response, userInfo, sender_psid, received_message);
    }
    else if (userInfo[sender_psid].wantsToJoinGroup) {
      joinGroup(response, userInfo, sender_psid, received_message);
    }
    else if (userInfo[sender_psid].wantsToAddTodo) {
      addTodo(response, userInfo, sender_psid, received_message);
    }
    else if (userInfo[sender_psid].wantsToGetMembers) {
      getMembers(response, userInfo, sender_psid, received_message);
    }
    else if (userInfo[sender_psid].wantsToGetTodos) {
      getTodos(response, userInfo, sender_psid, received_message);
    }
    else {
      // Send the response message
      userInfo[sender_psid] = {
        wantsToCreateGroup: false,
        wantsToJoinGroup: false,
        wantsToAddTodo: false,
        todoGroupWasGiven: '',
        todoWasGiven: '',
        wantsToGetTodos: false
      }
      sendBack.callSendAPI(sender_psid, response);
    }
  }
}

var initiatePrompts = function(response, userInfo, sender_psid, received_message) {
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
        },
        {
          "title": "OR",
          "subtitle": "Manage Todos",
          //"image_url": attachment_url,
          "buttons": [
            {
              "type": "postback",
              "title": "Add Todo!",
              "payload": "Add Todo!",
            },
            {
              "type": "postback",
              "title": "Get Todos!",
              "payload": "Get Todos!",
            }
          ],
        }]
      }
    }
  }
  // Send the response message
  sendBack.callSendAPI(sender_psid, response);
}

var createGroup = function(response, userInfo, sender_psid, received_message) {
  var groupID = received_message.text;
  Group.find( { id: groupID}, function (err, result) {
    console.log("find result", result)
    if (result.length === 0) {
      var dbQ = new Group({ id: groupID, owner: sender_psid, members: [sender_psid] })
      dbQ.save(function (err, results) {
        if (!err) {
          console.log("created group!")
          userInfo[sender_psid].wantsToCreateGroup = false;

          response = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": `You have created group: "${received_message.text}".`,
                  "subtitle": "Select what you'd like to do next...",
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
                },
                {
                  "title": "OR",
                  "subtitle": "Manage Todos",
                  //"image_url": attachment_url,
                  "buttons": [
                    {
                      "type": "postback",
                      "title": "Add Todo!",
                      "payload": "Add Todo!",
                    },
                    {
                      "type": "postback",
                      "title": "Get Todos!",
                      "payload": "Get Todos!",
                    }
                  ],
                }]
              }
            }
          }
          // Send the response message
          sendBack.callSendAPI(sender_psid, response);
        } else {
          console.log(err);
          userInfo[sender_psid].wantsToCreateGroup = false;
          response = {
            "text": `Error creating group. Reinitiate conversation by typing "Hello"`
          }
          // Send the response message
          sendBack.callSendAPI(sender_psid, response);
        }
      })
    } else {
      console.log("Group already exists!")
      userInfo[sender_psid].wantsToCreateGroup = false;
      response = {
        "text": `Group exists already. Reinitiate convo by typing "Hello" and join it!`
      }
      sendBack.callSendAPI(sender_psid, response);
    }
  })
}

var joinGroup = function(response, userInfo, sender_psid, received_message) {
  var groupID = received_message.text;
  var groupDb = Group.findOneAndUpdate({ "id" : groupID }, { $addToSet: { "members" : sender_psid } }, function (err, results) {
    if (!err) {
        if (results) {
          console.log("joined group!")
          userInfo[sender_psid].wantsToJoinGroup = false;
          response = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": `You have joined group: "${received_message.text}".`,
                  "subtitle": "Select what you'd like to do next...",
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
                },
                {
                  "title": "OR",
                  "subtitle": "Manage Todos",
                  //"image_url": attachment_url,
                  "buttons": [
                    {
                      "type": "postback",
                      "title": "Add Todo!",
                      "payload": "Add Todo!",
                    },
                    {
                      "type": "postback",
                      "title": "Get Todos!",
                      "payload": "Get Todos!",
                    }
                  ],
                }]
              }
            }
          }
        } else {
          console.log("Group not found!")
          userInfo[sender_psid].wantsToJoinGroup = false;
          response = {
            "text": `Group not found! Reinitiate conversation by typing "Hello" to restart convo`
          }
        }

        // Send the response message
        sendBack.callSendAPI(sender_psid, response);
    } else {
        console.log(err);
        userInfo[sender_psid].wantsToJoinGroup = false;
        response = {
          "text": `Error joining group. Reinitiate conversation by typing "Hello" and make sure to spell group properly`
        }
        // Send the response message
        sendBack.callSendAPI(sender_psid, response);
    }
  })
}

// groupid given first. If exists, ask for todo and then ask for deadline after todo is given.
var addTodo = function(response, userInfo, sender_psid, received_message) {
  response = {
    "text": `What is the todo that you want to add for yourself?`
  }

  if (userInfo[sender_psid].todoGroupWasGiven) {
    var groupID = userInfo[sender_psid].todoGroupWasGiven;

    if (userInfo[sender_psid].todoWasGiven) {
      var todo = userInfo[sender_psid].todoWasGiven;
      var deadline = new Date(received_message.text);

      var groupDb = Group.findOneAndUpdate({ "id" : groupID }, { $addToSet: { "todos" : { person: sender_psid, item: todo, date: deadline} } }, function (err, results) {
        if (!err) {
            if (results) {
              console.log("added todo!")
              response = {
                "attachment": {
                  "type": "template",
                  "payload": {
                    "template_type": "generic",
                    "elements": [{
                      "title": `You have added todo: "${todo}" to group "${groupID}"`,
                      "subtitle": "Select what you'd like to do next...",
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
                    },
                    {
                      "title": "OR",
                      "subtitle": "Manage Todos",
                      //"image_url": attachment_url,
                      "buttons": [
                        {
                          "type": "postback",
                          "title": "Add Todo!",
                          "payload": "Add Todo!",
                        },
                        {
                          "type": "postback",
                          "title": "Get Todos!",
                          "payload": "Get Todos!",
                        }
                      ],
                    }]
                  }
                }
              }

            } else {
              console.log("Group not found!")
              response = {
                "text": `Group not found! Reinitiate conversation by typing "Hello" to restart convo`
              }
            }
            userInfo[sender_psid].wantsToAddTodo = false;
            userInfo[sender_psid].todoGroupWasGiven = '';
            userInfo[sender_psid].todoWasGiven = '';
            // Send the response message
            sendBack.callSendAPI(sender_psid, response);
        } else {
            console.log(err);
            userInfo[sender_psid].wantsToAddTodo = false;
            userInfo[sender_psid].todoGroupWasGiven = '';
            userInfo[sender_psid].todoWasGiven = '';
            response = {
              "text": `Error adding todo. Reinitiate conversation by typing "Hello".`
            }
            // Send the response message
            sendBack.callSendAPI(sender_psid, response);
        }
      })
    } else {
      response = {
        "text": `What is the deadline for the todo? For example, say "December 11, 2018 11:00:00"`
      }
      userInfo[sender_psid].todoWasGiven = received_message.text;
      sendBack.callSendAPI(sender_psid, response);
    }
  } else {
    var groupID = received_message.text;

    Group.findOne( { id: groupID}, function (err, result) {
      console.log("find result", result)
      if (!result) {
        console.log("Group does not exist!")
        userInfo[sender_psid].wantsToAddTodo = false;
        response = {
          "text": `Group does not exist. Reinitiate convo by typing "Hello" and create it!`
        }
        sendBack.callSendAPI(sender_psid, response);
      } else if (result.members.includes(sender_psid)){
        console.log("Group exists! Will add todo now!")
        userInfo[sender_psid].todoGroupWasGiven = received_message.text;

        sendBack.callSendAPI(sender_psid, response);
      } else {
        console.log("User not in group! Cannot add todo")
        userInfo[sender_psid].wantsToAddTodo = false;
        response = {
          "text": `User not in group and cannot add todo! Reinitiate convo by typing "Hello" and join it!`
        }
        sendBack.callSendAPI(sender_psid, response);
      }
    })
  }
}

var getTodos = function(response, userInfo, sender_psid, received_message) {
  var groupID = received_message.text;

  Group.findOne( { id: groupID}, function (err, result) {
    console.log("!!!!!!find result", result)
    if (!result) {
      console.log("Group does not exist!")
      userInfo[sender_psid].wantsToGetTodos = false;
      response = {
        "text": `Group does not exist. Reinitiate convo by typing "Hello" and create it!`
      }
      sendBack.callSendAPI(sender_psid, response);
    } else if (result.members.includes(sender_psid)) {
      console.log("Group exists! Getting todos")

      result.todos.forEach(function(e) {
        var id = e.person;
        var item = e.item;
        var date = e.date.toLocaleDateString();
        var time = e.date.toLocaleTimeString();

        response = {
          "text": `User ID: ${id} has to do - ${item} - by ${date} at ${time}`
        }

        sendBack.callSendAPI(sender_psid, response);
      })

      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": `Those are the todos for group "${groupID}."`,
              "subtitle": `You are User "${sender_psid}". Give me a task!`,
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
            },
            {
              "title": "OR",
              "subtitle": "Manage Todos",
              //"image_url": attachment_url,
              "buttons": [
                {
                  "type": "postback",
                  "title": "Add Todo!",
                  "payload": "Add Todo!",
                },
                {
                  "type": "postback",
                  "title": "Get Todos!",
                  "payload": "Get Todos!",
                }
              ],
            }]
          }
        }
      }

      userInfo[sender_psid].wantsToGetTodos = false;
      sendBack.callSendAPI(sender_psid, response);
    } else {
      console.log("User not in group")
      userInfo[sender_psid].wantsToGetTodos = false;
      response = {
        "text": `User not in group and cannot get todos. Reinitiate convo by typing "Hello" and join it!`
      }
      sendBack.callSendAPI(sender_psid, response);
    }
  })
}

var handleMSG = {
  handleMessage: handleMessage
};

module.exports = handleMSG;
