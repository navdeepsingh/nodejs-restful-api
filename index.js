// Main API File

// Dependancies
const http =  require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const handlers =  require('./lib/handlers');
const _data = require('./lib/data');
const helpers = require('./lib/helpers');

// Create http server
const server = http.createServer((req, res) => {

  // Parse the url
  const parsedUrl  = url.parse(req.url, true);

  // Get query string object
  const queryStringObject = parsedUrl.query;

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/$/g, '');

  // Get method
  const method = req.method;

  // Get Headers
  const headers = req.headers;

  // Get Payload if any
  let buffer = '';
  const decoder = new StringDecoder('utf-8');
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    // Construct data
    const data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    // Choose Handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      payload = typeof(payload) == 'object' ? payload : {};

      const payloadString = JSON.stringify(payload);

      res.writeHead(statusCode, {
        'Content-Type' : 'application/json'
      });
      res.end(payloadString);

      console.log('Returning the response: ', statusCode, payload);
    });


  })

});

// Listen to port
server.listen(config.port, () => {
  console.log(`Server is listening up at port ${config.port} and running ${config.envName}`);
});


// Define Router
const router = {
  'hello' : handlers.hello,
  'ping' : handlers.ping,
  'users' : handlers.users
};
