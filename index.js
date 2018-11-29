/*
*
* Main API File
*
*/

// Dependancies
const server = require('./lib/server');
//const server = require('./lib/server');

// Declare the app
const app = {};

// Init function
app.init = () => {
  // Start the server
  server.init();
};

// Execute the function
app.init();

// Export the app
//module.exports = app;
