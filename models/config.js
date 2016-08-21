var thinky = require(__dirname + '/../util/thinky.js');
var type = thinky.type;

var Config = thinky.createModel("config", {
  id: type.string(),
  key: type.string().required(),
  value: type.any()
});

module.exports = Config;