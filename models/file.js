var thinky = require(__dirname + '/../util/thinky.js');
var type = thinky.type;

var File = thinky.createModel("files", {
  id: type.string(),
  fileId: type.string(),
  uploaderId: type.string(),
  originalName: type.string(),
  shortName: type.string(),
  mime: type.string(),
  ext: type.string(),
  hidden: type.boolean().default(false),
  timestamp: type.date(),
  views: type.number()
});

module.exports = File;

File.ensureIndex("timestamp");

var User = require(__dirname + '/../models/user.js');
File.belongsTo(User, "uploader", "uploaderId", "id");
