'use strict';

var path = require('path');
var uploadPath = require('config').get('uploadPath');

module.exports = (uploadPath.charAt[0] === path.sep ? uploadPath : path.join(__dirname, '..', uploadPath));