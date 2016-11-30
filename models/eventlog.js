const thinky = require(__dirname + '/../util/thinky.js');
const type = thinky.type;

const EventLog = thinky.createModel("eventlog", {
  id: type.string(),
  timestamp: type.date(),
  type: type.string(),
  sourceIP: type.string(),
  userId: type.string(),
  event_info: type.object()
});

EventLog.ensureIndex("timestamp");

const User = require(__dirname + '/../models/user.js');
EventLog.belongsTo(User, "user", "userId", "id");

module.exports = EventLog;