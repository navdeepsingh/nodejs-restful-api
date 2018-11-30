/*
 *
 * Worker related tasks
 *
 */

 // Dependancies
 const path = require('path');
 const fs = require('fs');
 const _data = require('./data');
 const https = require('https');
 const http = require('http');
 const helpers = require('./helpers');
 const url = require('url');

 // Instantiate the worker object
const workers = {};

workers.gatherAllChecks = () => {
  // Get all the checks
  _data.list('checks', (err, checks) => {
    if(!err && checks && checks.length > 0) {
      checks.forEach(check => {
        // Rwead in check data
        _data.read('checks', check, (err, origCheckData) => {
          if (!err && origCheckData) {
            // Pass the data to check the validator and that function conitnue or log errors as needed
            workers.validateCheckData(origCheckData);
          } else {
            console.log('Error: Reading one of the checks data');            
          }
        });
      })
    } else {
      console.log('Erroe: Could not find any checks');      
    }
  })
}

// Sanity check the check-data
workers.validateCheckData = (origCheckData) => {
  origCheckData = typeof(origCheckData) == 'object' && origCheckData !== null ? origCheckData : {};
  origCheckData.id = typeof (origCheckData.id) == 'string' && origCheckData.id.trim().length > 0 ? origCheckData.id.trim() : false;
  origCheckData.userPhone = typeof (origCheckData.userPhone) == 'string' && origCheckData.userPhone.trim().length == 10 ? origCheckData.userPhone.trim() : false;
  origCheckData.protocol = typeof (origCheckData.protocol) == 'string' && ['http', 'https'].indexOf(origCheckData.protocol) > -1 ? origCheckData.protocol.trim() : false;
  origCheckData.url = typeof (origCheckData.url) == 'string' && origCheckData.url.trim().length > 0 ? origCheckData.url.trim() : false;
  origCheckData.method = typeof (origCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(origCheckData.method) > -1 ? origCheckData.method.trim() : false;
  origCheckData.successCodes = typeof (origCheckData.successCodes) == 'object' && origCheckData.successCodes instanceof Array && origCheckData.successCodes.length > 0 ? origCheckData.successCodes : false;
  origCheckData.timeoutSeconds = typeof (origCheckData.timeoutSeconds) == 'number' && origCheckData.timeoutSeconds.length > 0 && origCheckData.timeoutSeconds.length <= 5 ? origCheckData.timeoutSeconds : false;

  // Set the keys that may not be set (if the workers have never seen this check before)
  origCheckData.state = typeof (origCheckData.state) == 'string' && ['up', 'down'].indexOf(origCheckData.state) > -1 ? origCheckData.state.trim() : 'down';
  origCheckData.lastChecked = typeof (origCheckData.lastChecked) == 'number' && origCheckData.lastChecked.trim().length > 0 ? origCheckData.lastChecked.trim() : false;

  // If all the checks pass, pass the data along to the next in the process
  if (origCheckData
    && origCheckData.id
    && origCheckData.userPhone
    && origCheckData.protocol
    && origCheckData.url
    && origCheckData.method
    && origCheckData.successCodes
    && origCheckData.timeoutSeconds
    && origCheckData.state
    && origCheckData.lastChecked) {
      workers.performCheck(origCheckData);
    } else {
      console.log('Error: One of the checks is not properly formatted, Skipping it.');      
    }
}

// Perfome the check, send the origCheckData and the outcome of the check process to the next step in the process
workers.performCheck = (origCheckData) => {
  // Prepare the initial check outcome
  const checkOutcome = {
    'error': false,
    'responseCode': false
  };

  // Mark that the outcome has not sent yet
  const outcomeSent = false;

  // Parse the hostname and the path out of the original check data
  const parsedUrl =  url.parse(origCheckData.protocol+'://'+origCheckData.url, true);
  const hostName = parsedUrl.hostname;
  const path = parseUrl.path; // Using path and not "pathname" because we want the query string

  // Construct the request
  const requestDetails = {
    'protocol': origCheckData.protocol + ':',
    'hostname': hostName,
    'method': origCheckData.method.toLowerCase(),
    'path': path,
    'timeout': origCheckData.timeoutSeconds * 1000
  }

  // Instantiate the request object(using either the http or https module)
  const _moduleToUse = origCheckData.protocol == 'http' ? http : https;

  const req = _moduleToUse.request(requestDetails, (res) => {
    const status = res.statusCode;

    // Update the checkoutcome and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(origCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the error event so it does'nt get thrown
  req.on('error', (err) => {
    console.log(err);    

    // Update the checkoutcome and pass the data along
    checkOutcome.error = {
      'error' : true,
      'value': err
    };

    if (!outcomeSent) {
      workers.processCheckOutcome(origCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event
  req.on('timeout', (e) => {
    // Update the checkoutcome and pass the data along
    checkOutcome.error = {
      'error': true,
      'value': 'timeout'
    };

    if (!outcomeSent) {
      workers.processCheckOutcome(origCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // End the request
  req.end();
}


// Process the checkOutcome, update the check data as needed, trigger an alert if needed
// Special logic for accomodating a check that has never been tested before (don't alert on that one)
workers.processCheckOutcome = (origCheckData, checkOutcome) => {
  // Decide if the check is considered up or down
  const state = !checkOutcome.error && checkOutcome.responseCode && origCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  // Decide if an alert is needed
  const alertWanted = origCheckData.lastChecked && origCheckData.state != state ? true : false;


  // Update the check data
  const newCheckData = origCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // Save the updates
  _data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      // Send the new check data to the next phase in the process if needed
      if (alertWanted) {
        console.log('Trigger an alert for ' + newCheckData.method + ' ' + newCheckData.url + ' is currently ' + newCheckData.state);  
        //workers.alertUserToStatusChange(newCheckData);      
      } else {
        console.log('Check outcome has not changed, no alert needed');        
      }
    } else {
      console.log('Error trying to save updates to one of the checks');      
    }
  });
}

// Timer to execute the worker-process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60)
}

// init script
workers.init = () => {
  // Execute alll the checks immediately
  workers.gatherAllChecks();

  // Call the loop so the checks will execute later on
  workers.loop();
}

// Export the module
module.exports = workers;