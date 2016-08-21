var thinky = require(__dirname + '/../util/thinky.js');
var type = thinky.type;

var User = thinky.createModel("users", {
  id: type.string(),
  username: type.string().min(4),
  email: type.string().email(),
  password: type.string(),
  apiKey: type.string(),
  quotaUsed: type.number(),
  enabled: type.boolean().default(true),
  isAdmin: type.boolean().default(false)
});

module.exports = User;

User.ensureIndex("username");

var File = require(__dirname + '/../models/file.js');
User.hasMany(File, 'files', 'id', 'uploaderId');

var RememberMeToken = require(__dirname + '/../models/rememberMeToken.js');
User.hasMany(RememberMeToken, 'rememberMeToken', 'id', 'userId');
