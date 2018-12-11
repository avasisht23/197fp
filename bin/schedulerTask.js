var express = require('express')
var bodyParser = require('body-parser')
var cookieSession = require('cookie-session')
var mongoose = require('mongoose')
var request = require('request')
var app = express();

var sendTodosToUsers = [];
var sendToUsers = require('../handlers/callSendApi.js');

var Group = require('../models/groups');
var now = new Date();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/197fp')

// calling function upon running this script

function scheduler() {
  Group.find({}, function (err, res) {
    console.log("find result", res)
    res.forEach((g) => {
      console.log("todos length", g.todos.length)
      console.log("todos", g.todos)
      if (g.todos.length !== 0) {
        console.log("todos elt", g.todos[0])
        g.todos.forEach((elt) => {
          console.log("elt", elt)
          var date = g.todos[elt].date;
          var sender_psid = g.todos[todo].person;
          var item = g.todos[elt].item;

          var nowPlusHour = now.getHours() + 1;
          var nowPlus10Min = now.getMinutes() + 10;
          var nowPlusDay = now.getDate() + 1;

          // if(date.toString() === now.toString() || date.toString() === nowPlusHour.toString() ||
          //    date.toString() === nowPlus10Min.toString() || date.toString() === nowPlusDay.toString()) {
          //
          //    }
          //  })

          sendTodosToUsers.push({
            user: sender_psid,
            group: g.id,
            date: date,
            item: item
          });
    		// 	if (someLogicToCheckWhetherAReminderShouldGoOutNow) {
    		// 		groupsToSendRemindersTo.push(g, reminderToSendOut);
    		// 		markReminderAsSent();
    		// 	}
    		// })
    		// sendOutRemindersToAllGroupsIn(groupsToSendRemindersTo);
        console.log("UPDATE", sendTodosToUsers)
    	 })
      }
    })
  })
  console.log("here")
  sendTodos();
}

var sendTodos = function() {
  let response;

  sendTodosToUsers.forEach((todo) => {
    var sender_psid = sendTodosToUsers[todo].person;
    var date = sendTodosToUsers[todo].date.toLocaleDateString();
    var time = sendTodosToUsers[todo].date.toLocaleTimeString();
    var group = sendTodosToUsers[todo].group;
    var item = sendTodosToUsers[todo].item;

    response = {
      "text": `From Group "${group}," you have task "${item}" due on date ${date} at time ${time}`
    }
    console.log("!!!!", response)
    sendToUsers.callSendAPI(sender_psid, response);
  })
}

scheduler();

var schedulerTask = {
  scheduler: scheduler
};

module.exports = schedulerTask;
