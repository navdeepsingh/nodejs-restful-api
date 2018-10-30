// Main API File

// Dependancies
const http =  require('http');
const url = require('url');

// Create http server
const server = http.createServer((req, res) => {
   
  // Parse the url
  const parsedUrl  = url.parse(req.url, true);
  
  // Get the path
  let path = parsedUrl.pathname;
  path = path.replace(/^\/+|\/$/g, '');

  // Send the response
  res.end('Hello World\n');

  // Log the request/response
  console.log('Request received on path ' + path);
}); 

// Listen to port
server.listen(3000, () => {
  console.log('Server is listening up at port 3000');  
});