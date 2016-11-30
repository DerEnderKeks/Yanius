const thinky = require(__dirname + '/../util/thinky.js');
const type = thinky.type;

const Config = thinky.createModel("config", {
  id: type.number(),
  encryptionSecret: type.string(),
  sessionSecret: type.string(),
  maxFileSize: type.number(),
  maxQuota: type.number(),
  mimeList: type.array(),
  mimeListType: type.boolean()
});

module.exports = Config;