var thinky = require(__dirname + '/../util/thinky.js');
var r = thinky.r;
var User = require(__dirname + '/../models/user.js');
var File = require(__dirname + '/../models/file.js');
var uploadPath = require(__dirname + '/../util/upload-path.js');
var fs = require('fs');
var path = require('path');

/**
 * Get file list for a specific user
 * @param id Target user
 * @param startIndex startIndex
 * @param max max
 * @param callback callback
 * @return array Files as array
 */
exports.getFilesForUser = function (id, startIndex, max, callback) {
  File.orderBy({index: r.desc("timestamp")}).filter({uploaderId: id}).skip(startIndex).limit(max).then((result) => {
    return callback(null, result);
  }).error((error) => {
    return callback(error, null);
  });
};

/**
 * Get all files
 * @param startIndex startIndex
 * @param max max
 * @param callback callback
 */
exports.getFiles = function (startIndex, max, callback) {
  File.orderBy({index: r.desc("timestamp")}).skip(startIndex).limit(max).then((result) => {
    return callback(null, result);
  }).error((error) => {
    return callback(error, null);
  });
};

/**
 * Get all files with user
 * @param startIndex startIndex
 * @param max max
 * @param callback callback
 */
exports.getFilesWithUser = function (startIndex, max, callback) {
  File.orderBy({index: r.desc("timestamp")}).getJoin({uploader: true}).skip(startIndex).limit(max).then((result) => {
    result = result.map((element) => {
      let uploader = element.uploader;
      element.uploader = {};
      element.uploader.username = uploader.username;
      element.uploader.email = uploader.email;
      element.uploader.enabled = uploader.enabled;
      element.uploader.isAdmin = uploader.isAdmin;
      element.uploader.quotaUsed = uploader.quotaUsed;
      return element;
    });
    return callback(null, result);
  }).error((error) => {
    return callback(error, null);
  });
};

exports.deleteFile = function (id, callback) {
  File.get(id).then(function (result) {
    fs.unlink(path.join(uploadPath, result.fileId), (error) => {
      if (error) return callback(error, null);
      File.get(id).delete().then(function (result) {
        return callback(null, result);
      }).error(function (error) {
        return callback(error, null);
      });
    });
  }).error(function (error) {
    return callback(error, null);
  });
};

exports.getFile = function (id, callback) {
  File.get(id).then((result) => {
    return callback(null, result);
  }).error((error) => {
    return callback(error, null);
  });
};

/**
 * Get all users
 * @param startIndex startIndex
 * @param max max
 * @param callback callback
 */
exports.getUsers = function (startIndex, max, callback) {
  User.orderBy({index: r.asc("username")}).skip(startIndex).limit(max).then(function (result) {
    return callback(null, result);
  }).error(function (error) {
    return callback(error, null);
  });
};

/**
 * Get all users
 * @param username username
 * @param callback callback
 */
exports.getUser = function (username, callback) {
  User.filter(r.row('username').match('(?i)^' + username + '$')).then(function (result) {
    if (!result[0]) return callback(new Error(404), null);
    return callback(null, result[0]);
  }).error(function (error) {
    return callback(error, null);
  });
};

exports.editUser = function (user, callback) {
  User.get(user.id).update(user).then(function (result) {
    return callback(null, result);
  }).error(function (error) {
    return callback(error, null);
  });
};

exports.getUserById = function (id, callback) {
  User.get(id).then(function (result) {
    if (!result) return callback(new Error(404), null);
    return callback(null, result);
  }).error(function (error) {
    return callback(error, null);
  });
};

exports.deleteUser = function (id, callback) {
  User.get(id).getJoin({files: true, rememberMeToken: true}).then(function (user) {
    if (!user) return callback(new Error(404), null);
    user.deleteAll({files: true, rememberMeToken: true}).then(function (result) {
      r.table('sessions').filter({session: {passport: {user: id}}}).delete().run().then(function (res) {
        return callback(null, res);
      }).error(function (error) {
        return callback(error, null);
      });
    }).error(function (error) {
      return callback(error, null);
    });
  }).error(function (error) {
    return callback(error, null);
  });
};

exports.addUser = function (user, callback) {
  var newUser = new User(user);
  this.getUser(user.username, function (error, result) {
    if (!error || (error && error.message !== '404')) return callback(new Error(400), null);
    newUser.save().then(function (result) {
      return callback(null, result);
    }).error(function (error) {
      return callback(error, null);
    });
  });
};

exports.addFile = function (file, callback) {
  var newUser = new File(file);
  newUser.save().then(function (result) {
    return callback(null, result);
  }).error(function (error) {
    return callback(error, null);
  });
};

exports.getFile = function (shortName, callback) {
  File.filter({shortName: shortName}).then(function (result) {
    return callback(null, result[0]);
  }).error(function (error) {
    return callback(error, null);
  });
};

exports.increaseViewCount = function (id, callback) {
  File.get(id).update({views: r.row("views").add(1)}).then(function (result) {
    return callback(null, result);
  }).error(function (error) {
    return callback(error, null);
  });
};

exports.getFileById = function (id, callback) {
  File.get(id).then(function (result) {
    return callback(null, result);
  }).error(function (error) {
    return callback(error, null);
  });
};