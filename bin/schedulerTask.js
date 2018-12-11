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
      if (g.todos.length !== 0) {
        g.todos.forEach((elt) => {
          var date = elt.date;
          var sender_psid = elt.person;
          var item = elt.item;

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
    console.log("here")
    sendTodos();
  })
}

var sendTodos = function() {
  let response;

  sendTodosToUsers.forEach((todo) => {
    var sender_psid = todo.person;
    var date = todo.date.toLocaleDateString();
    var time = todo.date.toLocaleTimeString();
    var group = todo.group;
    var item = todo.item;

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
