/*
 * Handlers file
 *
 */


// Dependancies
const _data = require('./data');
const helpers = require('./helpers');


// Define Hanlders
const handlers = {};

// Define Hello Handler
handlers.hello = (data, callback) => {
  callback(null, {'message' : '########Welcome to NodeJS Shakalaka Boom Boom########'})
}

// Define Ping Handler
handlers.ping = (data, callback) => {
  callback(200, {'message' : 'Running'})
}

// Define Users Handler
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  const dataMethod = data.method.toLowerCase();
  if (acceptableMethods.indexOf(dataMethod) > -1) {
    handlers._users[dataMethod](data, callback);
  } else {
    callback(405);
  }
}

// Container for User Submenthods
handlers._users = {};

// post
// Requred data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read('users', phone, (err, data) => {

      if (err) { // File Not exists or User Not Exists
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const dataObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'password' : hashedPassword,
            'tosAgreement' : tosAgreement
          }

          _data.create('users', phone, dataObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500, {'Error' : 'Could not hash the user\'s password'});
        }

      } else {
        callback(400, {'Error' : 'A with that phone number already exists'});
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
}


// get
// Required data: phone
// Optional data: none
handlers._users.get = (data, callback) => {
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

  if (phone) {
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        delete data.password;
        callback(200, data);
      } else {
        callback(500, {'Error': 'Some error while reading file ' + phone + '.json'});
      }
    });
  } else {
      callback(400, {'Error' : 'Missing required fields'});
  }
}

handlers._users.put = (data, callback) => {

}

handlers._users.delete = (data, callback) => {

}

// Define NotFound Handler
handlers.notFound = (data, callback) => {
  callback(404);
}


// Export Handlers
module.exports = handlers;
