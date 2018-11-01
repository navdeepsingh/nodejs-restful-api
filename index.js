// Main API File

// Dependancies
const http =  require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

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
      'payload': buffer
    }

    // Choose Handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;    

    chosenHandler((statusCode, payload) => {
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
server.listen(3000, () => {
  console.log('Server is listening up at port 3000');  
});

// Define Hanlders
const handlers = {};

// Define Hello Handler
handlers.hello = (callback) => {
  callback(null, {'message' : '########Welcome to NodeJS Shakalaka Boom Boom########'})
}

// Define NotFound Handler
handlers.notFound = (callback) => {
  callback(404);
}

// Define Router
const router = {
  'hello' : handlers.hello
};

