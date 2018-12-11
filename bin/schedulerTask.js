var express = require('express')
var bodyParser = require('body-parser')
var cookieSession = require('cookie-session')
var mongoose = require('mongoose')
var request = require('request')
var app = express();

var sendTodosToUsers = [];
var sendToUsers = require('./handlers/callSendApi.js');

var Group = require('../models/groups');
var now = new Date();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/197fp')

// calling function upon running this script
scheduler();

var scheduler = function() {
  Group.find({}, function (err, res) {
    console.log("find result", res)
    res.forEach((g) => {
      g.todos.forEach((todo) => {
        var date = todo.date;
        var sender_psid = todo.person;
        var item = todo.item;

        var nowPlusHour = now.getHours() + 1;
        var nowPlus10Min = now.getMinutes() + 10;
        var nowPlusDay = now.getDate() + 1;

        // if(date.toString() === now.toString() || date.toString() === nowPlusHour.toString() ||
        //    date.toString() === nowPlus10Min.toString() || date.toString() === nowPlusDay.toString()) {
        //
        //    }
        //  })

        sendTodosToGroups[sender_psid].push({
          group: g,
          date: date,
          item: item
        });


    		// 	if (someLogicToCheckWhetherAReminderShouldGoOutNow) {
    		// 		groupsToSendRemindersTo.push(g, reminderToSendOut);
    		// 		markReminderAsSent();
    		// 	}
    		// })
    		// sendOutRemindersToAllGroupsIn(groupsToSendRemindersTo);
    	})
  })
  sendTodos();
}

var sendTodos = function() {
  let response;
  sendTodosToUsers.forEach((sender_psid) => {
    var date = sendTodosToUsers[sender_psid].date.toLocaleDateString();
    var time = sendTodosToUsers[sender_psid].date.toLocaleTimeString();
    var group = sendTodosToUsers[sender_psid].group;
    var item = sendTodosToUsers[sender_psid].item;

    response = {
      "text": `From Group "${group}," you have task "${item}" due on date ${date} at time ${time}`
    }

    sendToUsers.callSendAPI(sender_psid, response);
  })
}
