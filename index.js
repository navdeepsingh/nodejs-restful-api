/*
*
* Main API File
*
*/

// Dependancies
const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare the app
const app = {};

// Init function
app.init = () => {
  // Start the server
  server.init();

  // Start the worker
  workers.init();
};

// Execute the function
app.init();

// Export the app
//module.exports = app;
