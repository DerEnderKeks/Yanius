var thinky = require(__dirname + '/../util/thinky.js');
var type = thinky.type;

var RememberMeToken = thinky.createModel("remembermetoken", {
  id: type.string(),
  token: type.string(),
  userId: type.string()
});

module.exports = RememberMeToken;

var User = require(__dirname + '/../models/user.js');
RememberMeToken.belongsTo(User, "user", "userId", "id");
