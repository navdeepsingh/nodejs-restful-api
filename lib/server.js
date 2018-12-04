/*
*
* Server related tasks
*
*/
// Dependancies
const http =  require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const handlers =  require('./handlers');
const _data = require('./data');
const helpers = require('./helpers');
const fs = require('fs');

const server = {};


// Create http server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

const httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem'),
}

// Create https server
server.httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

server.init = () => {
  // Listen to http port
  server.httpServer.listen(config.httpPort, () => {
    console.log(`Server is listening up at port ${config.httpPort} and running ${config.envName}`);
  });

  // Listen to https port
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(`Server is listening up at port ${config.httpsPort} and running ${config.envName}`);
  });
};


server.unifiedServer = (req, res) => {
  // Parse the url
  const parsedUrl = url.parse(req.url, true);

  // Get query string object
  const queryStringObject = parsedUrl.query;

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/$/g, '');

  // Get method
  const method = req.method.toLowerCase();

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
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    // Choose Handler
    const chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
      payload = typeof (payload) == 'object' ? payload : {};

      const payloadString = JSON.stringify(payload);

      res.writeHead(statusCode, {
        'Content-Type': 'application/json'
      });
      res.end(payloadString);

      console.log('Returning the response: ', statusCode, payload, method, queryStringObject);
    });
  });
}


// Define Router
server.router = {
  'hello' : handlers.hello,
  'ping' : handlers.ping,
  'test': handlers.test,
  'users' : handlers.users,
  'tokens' : handlers.tokens,
  'checks' : handlers.checks
};


module.exports = server;
