/*
 * Handlers file
 *
 */


// Dependancies
const _data = require('./data');
const helpers = require('./helpers');
const config =  require('./config');


// Define Hanlders
const handlers = {};

/*
*
* HTML Handlers
*
*/
handlers.index = (data, callback) => {
  if (data.method == 'get') {

    // Prepare data for intepolation
    const templateData = {
      'head.title' : 'This is the title',
      'head.description': 'This is the meta description',
      'body.title': 'Hello templated nodejs world',
      'body.class': 'index'
    }

    helpers.getTemplate('index', templateData, (err, str) => {
      if (!err && str) {
        helpers.addUniversalTemplates(str, templateData, (err, str) => {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');    
          }          
        });        
      } else {
        callback(500, undefined, 'html');
      }
    })
  } else {
    callback(405, undefined, 'html');
  }
  
}

// Favicon
handlers.favicon = (data, callback) => {
  if (data.method == 'get') {
    helpers.getStaticAsset('favicon.ico', (err, str) => {
      if (!err && str) {
        callback(200, str, 'ico');        
      } else {
        callback(500);
      }
    });
  } else {
    callback(405)
  }
}

// Public Assets
handlers.public = (data, callback) => {
  console.log('Here Public Handler');
  
  if (data.method == 'get') {
    const trimmedAssetName = data.trimmedPath.replace('public/','').trim();
    const directory = 'public/';
    if (trimmedAssetName.length > 0) {
      helpers.getStaticAsset(trimmedAssetName, directory, (err, data) => {
        // Determine the content type (default to plain text)
        let contentType = 'plain';

        if(trimmedAssetName.indexOf('.css') > -1) {
          contentType = 'css';
        }

        if (trimmedAssetName.indexOf('.js') > -1) {
          contentType = 'js';
        }        

        if (trimmedAssetName.indexOf('.jpg') > -1) {
          contentType = 'jpg';
        }
        
        if (trimmedAssetName.indexOf('.png') > -1) {
          contentType = 'png';
        }
        
        if (trimmedAssetName.indexOf('.ico') > -1) {
          contentType = 'ico';
        }   
        
        // Callback the data
        callback(200, data, contentType);

      });
    }
  } else {
    callback(405);
  }
}


// Define Hello Handler
handlers.hello = (data, callback) => {
  callback(null, {'message' : '########Welcome to NodeJS Shakalaka Boom Boom########'})
}

// Define Test Handler
handlers.test = (data, callback) => {
  callback(null, data.payload);
}

// Define Ping Handler
handlers.ping = (data, callback) => {
  callback(200, {'message' : 'Running'})
}

// Define Users Handler
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  const dataMethod = data.method;
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

    // Get the token from the Headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            delete data.password;
            callback(200, data);
          } else {
            callback(500, {'Error': 'Some error while reading file ' + phone + '.json'});
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token in header, or token is invalid'})
      }
    });


  } else {
      callback(400, {'Error' : 'Missing required fields'});
  }
}


// put
// Required data: phone
// Optional data: firstName, lastName, password (atleast one)
handlers._users.put = (data, callback) => {
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if ((firstName || lastName || password ) && phone) {

    // Get the token from the Headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {

        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {

          _data.read('users', phone, (err, userData) => {
            if (!err) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.password = hashedPassword;
              }

              _data.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(false);
                } else {
                  callback(500, {'Error': 'Could not update the user'});
                }
              });
            }
          })

        } else {
          callback(500, {'Error': 'Password not hashed'});
        }

      } else {
        callback(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }

}


// delete
// Required data: phone
// Optional data: none
handlers._users.delete = (data, callback) => {
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

  if (phone) {

    // Get the token from the Headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {

        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            _data.delete('users', phone, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback(500, {'Error': 'Some deleting file ' + phone + '.json'});
              }
            })
          } else {
            callback(500, {'Error': 'Some error while reading file ' + phone + '.json'});
          }
        });

      } else {
        callback(403, {'Error': 'Missing required token in header, or token is invalid'});
      }
    });
  } else {
      callback(400, {'Error' : 'Missing required fields'});
  }
}

// Define NotFound Handler
handlers.notFound = (data, callback) => {
  callback(404);
}

handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  const dataMethod = data.method;
  if (acceptableMethods.indexOf(dataMethod) > -1) {
    handlers._tokens[dataMethod](data, callback);
  } else {
    callback(405);
  }
}

// Create container for tokens sub methods
handlers._tokens = {}

// Tokens - post
// Required data: phone, Password
// Optional data: none
handlers._tokens.post = (data, callback) => {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    // Lookup the users who matches the phone and password
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // Check password is correct
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.password) { // if password matches
          // Create token
          const randomToken = helpers.generateToken();
          if (randomToken) { // If valid token
            const tokenData = {
              'phone': phone,
              'id': randomToken,
              'expires': Date.now() + 1000 * 60 * 60
            }
            _data.create('tokens', randomToken, tokenData, (err) => {
              if (!err) {
                callback(null, tokenData);
              } else {
                callback(500, {'Error': 'Error in creating token file'});
              }
            });
          }
        } else {
          callback(400, {'Error': 'Password Mis-matched'});
        }
      } else {
        callback(500, {'Error' : 'Error in reading file'});
      }
    })
  } else {
    callback(400, {"Error": "Missing required field(s)"});
  }
}

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
  console.log(data.queryStringObject.id);
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;

  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(null, tokenData);
      } else {
        callback(404, {'Error': 'Some error while reading file ' + id + '.json'});
      }
    });
  } else {
      callback(400, {'Error' : 'Missing required fields'});
  }
}

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = (data, callback) => {
  const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
  const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend ? true : false;

  if (id) {
      // Look up the token
      _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
          // Check if token already not expired
          console.log(tokenData.expires, Date.now());
          if (tokenData.expires > Date.now()) {
            // Set the expiration an hour from now
            tokenData.expires = Date.now() + 1000 * 60 * 60;

            // Store the new updates
            _data.update('tokens', id, tokenData, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback(500, {'Error': 'Could not update the token\'s expiration'});
              }
            });
          } else {
            callback(400, {'Error': 'The token already expired and can\'t be extended'});
          }
        }
      });

  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
}

// delete
// Required data: id
// Optional data: none
handlers._tokens.delete = (data, callback) => {
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;

  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete('tokens', id, (err) => {
          if (!err) {
            callback(false);
          } else {
            callback(500, {'Error': 'Some deleting file ' + id + '.json'});
          }
        })
      } else {
        callback(500, {'Error': 'Some error while reading file ' + id + '.json'});
      }
    });
  } else {
      callback(400, {'Error' : 'Missing required fields'});
  }
}

handlers._tokens.verifyToken = (id, phone, callback) => {
  // Look up the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check if token is of given user and is not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
}

// Define Checks Handler
handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  const dataMethod = data.method;
  if (acceptableMethods.indexOf(dataMethod) > -1) {
    handlers._checks[dataMethod](data, callback);
  } else {
    callback(405);
  }
}

// Define container of sub-methods
handlers._checks = {}

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = (data, callback) => {
  const protocol = typeof(data.payload.protocol) == 'string' && data.payload.protocol.trim().length > 0 ? data.payload.protocol.trim() : false;
  const url = typeof(data.payload.protocol) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false;
  const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 ? data.payload.timeoutSeconds : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
  // Get the token from the Headers
  const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
 
    _data.read('tokens', token, (err, tokenData) => {    
      
      if (!err && tokenData) {
        const userPhone = tokenData.phone;        
        
        // Now check in user
        _data.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            
            // Verify that user has less than the number of max-checks-per-user
            if (userChecks.length < config.maxChecks) {
              // Create the ramdom id for checks
              const checkId = helpers.generateToken();

              // Create the check object and include in user's phone
              const checkObject = {
                'id': checkId,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds': timeoutSeconds
              }

              _data.create('checks', checkId, checkObject, (err) => {
                if (!err) {
                  // Add the checkId in user object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // SAve the new user data
                  _data.update('users', userPhone, userData, (err) => {
                    if (!err) {
                      // Return the data about new check
                      callback(null, checkObject);
                    } else {
                      callback(500, {'Error': 'Could not update the user with new check'});
                    }
                  })
                } else {
                  callback(500, {'Error': 'Could not create new check'});
                }
              })

            } else {
              callback(400, {'Error': 'The user has already the max number of checks { '+ config.maxChecks +' }'});
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
  }
  
}


// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = (data, callback) => {
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;

  if (id) {
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {

        // Get the token from the Headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            _data.read('users', phone, (err, data) => {
              if (!err && data) {
                delete data.password;
                callback(200, data);
              } else {
                callback(500, { 'Error': 'Some error while reading file ' + checkData.userPhone + '.json' });
              }
            });
          } else {
            callback(403, { 'Error': 'Missing required token in header, or token is invalid' })
          }
        });

      } else {
        callback(404, { 'Error': 'Some error while reading file ' + id + '.json' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
}


// Checks - put
// Required data: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.put = (data, callback) => {
  // Check for the required field
  const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;

  // Check for optional fields
  const protocol = typeof (data.payload.protocol) == 'string' && data.payload.protocol.trim().length > 0 ? data.payload.protocol.trim() : false;
  const url = typeof (data.payload.protocol) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false;
  const successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array ? data.payload.successCodes : false;
  const timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 ? data.payload.timeoutSeconds : false;

  // Check to make sure id is valid
  if (id) {
    // check for other fields data
    if (protocol || url || method || successCodes || timeoutSeconds) {

      // Lookup the check
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          // Get the token from the Headers
          const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
          handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
            if (tokenIsValid) {
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }
              _data.update('checks', id, checkData, (err) => {
                if (!err) {
                  callback(200, data);
                } else {
                  callback(500, { 'Error': 'Some error in updating file ' + id + '.json' });
                }
              });
            } else {
              callback(403, { 'Error': 'Missing required token in header, or token is invalid' })
            }
          });          
        } else {
          callback(403, { 'Error': 'Missing required id, or id is invalid' })
        }
      });
      
    } else {
      callback(400, { 'Error': 'Missing required inputs, or inputs are invalid' });
    }
  } 

}

// checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = (data, callback) => {
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;

  if (id) {

        _data.read('checks', id, (err, checkData) => {
          if (!err && checkData) {
            _data.delete('checks', id, (err) => {
              if (!err) {
                // Get the token from the Headers
                const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                  if (tokenIsValid) {
                    //@TODO Update Array object too from users file
                    _data.read('users', checkData.userPhone, (err, userData) => {
                      if (!err && userData) {
                        const userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // Remove the deleted check from the list of checks
                        const checkPosition = userChecks.indexOf(id);
                        if(checkPosition > -1) {
                          userChecks.splice(checkPosition,1);

                          // Re-save the user's data
                          _data.update('users', checkData.userPhone, userData, (err) => {
                            if (!err) {
                              callback(false);
                            } else {
                              callback(500, { 'Error': 'Could not update the user' });
                            }
                          });

                        } else {
                          callback(500, {'Error': 'Could not find the mentioned check in check list, so can\'t remove the check.'});
                        }
                        
                        
                      } else {
                        callback(500, { 'Error': 'Could not find the user who created this check, so could not remove the check from from checks of user\`s object' });
                      }
                    });                    
                  } else {
                    callback(403, { 'Error': 'Missing required token in header, or token is invalid' });
                  }
                });
                
              } else {
                callback(500, { 'Error': 'Some deleting file ' + id + '.json' });
              }
            });
          } else {
            callback(500, { 'Error': 'Some error while reading file ' + id + '.json' });
          }
        });     
   
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
}



// Export Handlers
module.exports = handlers;
