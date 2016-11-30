'use strict';

const path = require('path');
const uploadPath = require('config').get('uploadPath');

module.exports = (uploadPath.charAt[0] === path.sep ? uploadPath : path.join(__dirname, '..', uploadPath));