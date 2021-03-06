var mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
  id: { type: String },
  owner: { type: String },
  members: { type: [String] },
  todos: { type: [ { person: {type: String}, item: {type: String}, date: {type: Date} } ] }
})

module.exports = mongoose.model('Groups', groupSchema);
