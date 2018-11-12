/*
 *
 * Helpers File
 *
 */

// Dependancies
const crypto = require('crypto');
const config = require('./config');

// Container for all the helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = (str) => {
  if (typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Generate Random Tokens
helpers.generateToken = (strLength = 20) => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    possibleChars = 'abcdefghijklomnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789';
    randomString = '';
    let i = 1;
    while (i <= strLength) {
      randomString += possibleChars.charAt(Math.floor(Math.random() * Math.floor(possibleChars.length)));
      i++;
    }
    return randomString;
  } else {
    return false;
  }
}

module.exports = helpers;
