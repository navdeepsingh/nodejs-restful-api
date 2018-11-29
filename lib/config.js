// Config File

// Create container for Config File
const environments = {};

environments.default = {
  'port' : 3000,
  'envName' : 'localhost',
  'hashingSecret' : 'thisIsSecret',
  'maxChecks' : 5,
  'twilio': {
    'accountSid': 'AC1cd5af2ac96cee14193054a11705a587',
    'authToken': '6561aa77c15896423e7fdd681d0b349f',
    'fromPhone': '+19844004948'
  }
}

environments.production = {
  'port' : 5000,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoSecret',
  'maxChecks': 5,
  'twilio': {
    'accountSid': 'AC1cd5af2ac96cee14193054a11705a587',
    'authToken': '6561aa77c15896423e7fdd681d0b349f',
    'fromPhone': '+19844004948'
  }
}

const config = process.env.NODE_ENV !== 'production' ? environments.default : environments.production;

// Export Container
module.exports = config;
