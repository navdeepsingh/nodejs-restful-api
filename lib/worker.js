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
    
  })
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
