// Config File

// Create container for Config File
const environments = {};

environments.default = {
  'httpPort' : 3000,
  'httpsPort': 3001,
  'envName' : 'localhost',
  'hashingSecret' : 'thisIsSecret',
  'maxChecks' : 5,
  'twilio': {
    'accountSid': 'AC1cd5af2ac96cee14193054a11705a587',
    'authToken': '6561aa77c15896423e7fdd681d0b349f',
    'fromPhone': '+19844004948'
  },
  'templateGlobals': {
    'appName': 'UptimeChecker',
    'companyName': 'NotARealCompany, Inc.',
    'yearCreated': '2018',
    'baseUrl': 'http://localhost:3000/'
  }
}

environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoSecret',
  'maxChecks': 5,
  'twilio': {
    'accountSid': 'AC1cd5af2ac96cee14193054a11705a587',
    'authToken': '6561aa77c15896423e7fdd681d0b349f',
    'fromPhone': '+19844004948'
  },
  'templateGlobals': {
    'appName': 'UptimeChecker',
    'companyName': 'NotARealCompany, Inc.',
    'yearCreated': '2018',
    'baseUrl': 'http://localhost:3000/'
  }
}

const config = process.env.NODE_ENV !== 'production' ? environments.default : environments.production;

// Export Container
module.exports = config;
