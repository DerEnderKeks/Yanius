const thinky = require(__dirname + '/../util/thinky.js');
const type = thinky.type;

const RememberMeToken = thinky.createModel("remembermetoken", {
  id: type.string(),
  token: type.string(),
  userId: type.string()
});

module.exports = RememberMeToken;

const User = require(__dirname + '/../models/user.js');
RememberMeToken.belongsTo(User, "user", "userId", "id");
