var thinky = require(__dirname + '/../util/thinky.js');
var type = thinky.type;

var Config = thinky.createModel("config", {
  id: type.number(),
  encryptionSecret: type.string(),
  sessionSecret: type.string(),
  maxFileSize: type.number(),
  maxQuota: type.number(),
  mimeList: type.array(),
  mimeListType: type.boolean()
});

module.exports = Config;