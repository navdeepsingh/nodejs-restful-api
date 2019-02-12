/*
 *
 * Helpers File
 *
 */

// Dependancies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

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

// Send message with Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  // Validate Parametes
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

  if (phone && msg) {

    // Configure the request payload
    const payload = {
      'From': config.twilio.fromPhone,
      'To': '+91'+phone,
      'Body': msg
    }

    const stringPayload = querystring.stringify(payload);

    // configure the request details
    const requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid+'/Messages.json',
      'auth': config.twilio.accountSid+':'+config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // instantiate the request object
    const req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      const status = res.statusCode;

      //Callback successfully igf the request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback('Status code returned was: ' + status);
      }
    });

    // Bind to the error event so it get doesnt get thrown
    req.on('error', (e) => {
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();


  } else {
    callback('Missing field(s) or invalid');
  }

}

helpers.getTemplate = (templateName, callback) => {
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  if (templateName) {
    const templateDir = path.join(__dirname, '/../templates');
    fs.readFile(templateDir + templateName + '.html',  'utf8', (err, str) => {
      if (!err && str && str.length > 0) {
        callback(false, str);
      } else {
        callback('No template could be found.');
      }
    })
  } else {
    callback('A valid template name was not specified.');
  }
}

module.exports = helpers;
