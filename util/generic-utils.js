var databaseUtils = require(__dirname + '/database-utils.js');

/**
 * Check whether a user is allowed to upload a specific file according to settings in database
 * @param {Object} file
 * @param {Object} user
 * @param {Function} callback
 */

exports.checkUploadRestriction = (file, user, callback) => {
  databaseUtils.getSettings((error, settings) => {
    if (error) return callback(error, false, null);
    if (settings.mimeList) {
      if (settings.mimeListType) {
        if (settings.mimeList.indexOf(file.mime) > -1) return callback(null, false, 'Forbidden file type'); // Nope
      } else {
        if (settings.mimeList.indexOf(file.mime) < 0) return callback(null, false, 'Forbidden file type'); // Nope
      }
    }

    if (file.size > settings.maxFileSize) return callback(null, false, 'File exceeds maximum file size'); // Still nope

    if ((user.quotaUsed + file.size) > settings.maxQuota) return callback(null, false, 'Quota exceeded'); // Close

    return callback(null, true, null); // Everything is fine.
  })
};