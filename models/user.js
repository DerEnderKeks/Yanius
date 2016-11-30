const thinky = require(__dirname + '/../util/thinky.js');
const type = thinky.type;

const User = thinky.createModel("users", {
  id: type.string(),
  username: type.string().min(4),
  email: type.string().email(),
  password: type.string(),
  apiKey: type.string(),
  quotaUsed: type.number().default(0),
  enabled: type.boolean().default(true),
  isAdmin: type.boolean().default(false)
});

module.exports = User;

User.ensureIndex("username");

const File = require(__dirname + '/../models/file.js');
User.hasMany(File, 'files', 'id', 'uploaderId');

const RememberMeToken = require(__dirname + '/../models/rememberMeToken.js');
User.hasMany(RememberMeToken, 'rememberMeToken', 'id', 'userId');
