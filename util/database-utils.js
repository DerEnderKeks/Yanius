const thinky = require(__dirname + '/../util/thinky.js');
const Errors = thinky.Errors;
const r = thinky.r;
const User = require(__dirname + '/../models/user.js');
const File = require(__dirname + '/../models/file.js');
const Config = require(__dirname + '/../models/config.js');
const EventLog = require(__dirname + '/../models/eventlog.js');
const uploadPath = require(__dirname + '/../util/upload-path.js');
const fs = require('fs');
const path = require('path');

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
  File.get(id).then(function (file) {
    fs.unlink(path.join(uploadPath, file.fileId), (error) => {
      if (error) return callback(error, null);
      File.get(id).delete().then(function (result) {
        User.get(file.uploaderId).update({quotaUsed: r.row("quotaUsed").sub(file.size)}).then(function (result) {
          return callback(null, result);
        }).error(function (error) {
          return callback(error, null);
        });
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

exports.editFile = function (file, callback) {
  File.get(file.id).update(file).then(function (result) {
    return callback(null, result);
  }).error(function (error) {
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
  User.orderBy({index: r.asc("username")}).getJoin({files: true}).skip(startIndex).limit(max).then(function (result) {
    result.map((element) => {
      element.fileCount = element.files.length;
      element.files = undefined;
    });
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
  User.get(id).getJoin({files: true}).then(function (result) {
    if (!result) return callback(new Error(404), null);
    result.fileCount = result.files.length;
    result.files = undefined;
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
  let newUser = new User(user);
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
  let newFile = new File(file);
  newFile.save().then(function (result) {
    User.get(file.uploaderId).update({quotaUsed: r.row("quotaUsed").add(file.size)}).then(function (result) {
      return callback(null, file);
    }).error(function (error) {
      return callback(error, null);
    });
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

exports.getSettings = function (callback) {
  Config.get(1).then((result) => {
    return callback(null, result);
  }).catch(Errors.DocumentNotFound, (error) => {
    return callback(error, null);
  }).error((error) => {
    return callback(error, null);
  });
};

exports.getSetting = function (setting, callback) {
  Config.get(1).then((result) => {
    return callback(null, result[setting]);
  }).catch(Errors.DocumentNotFound, (error) => {
    return callback(error, null);
  }).error((error) => {
    return callback(error, null);
  });
};

exports.setSettings = function (settings, callback) {
  Config.delete().then(() => {
    settings.id = 1;
    let newConfig = new Config(settings);
    newConfig.save(settings).then((result) => {
      return callback(null, result);
    }).error((error) => {
      return callback(error, null);
    })
  })
};

exports.updateSettings = function (settings, callback) {
  Config.get(1).update(settings).then((result) => {
    return callback(null, result);
  }).error((error) => {
    return callback(error, null);
  })
};

/**
 * Log event to database
 * @param {string} event - Event type
 * @param {string} userId - User ID
 * @param {string} sourceIP - Source IP Address
 * @param {object} info - Additional data
 * @param {function} callback - Callback
 */
exports.logEvent = (event, userId, sourceIP, info, callback) => {
  let newEvent = new EventLog({
    timestamp: new Date(),
    type: event,
    sourceIP: sourceIP,
    userId: userId || null,
    event_info: info
  });
  exports.getSetting('events', (err, result) => {
    if (err && !result) return callback(null, result);
    let temp = [];
    for (let key in result) {
      if (!result.hasOwnProperty(key)) continue;
      if (result[key].enabled) temp.push(key);
    }
    if (temp.indexOf(newEvent.type) > -1) {
      newEvent.save().then((result) => {
        return callback(null, result);
      }).error((error) => {
        return callback(error, null);
      })
    }
  });
};

/**
 * Get events
 * @param startIndex startIndex
 * @param max max
 * @param callback callback
 */
exports.getEvents = function (startIndex, max, callback) {
  EventLog.orderBy({index: r.desc("timestamp")}).skip(startIndex).limit(max).getJoin({user: true}).then((result) => {
    result.map((element) => {
      if (!element.userId || !element.user) return element;
      element.username = element.user.username;
      element.user = undefined;
      return element;
    });
    return callback(null, result);
  }).error((error) => {
    return callback(error, null);
  });
};