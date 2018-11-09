// Config File

// Create container for Config File
const environments = {};

environments.default = {
  'port' : 3000,
  'envName' : 'localhost',
  'hashingSecret' : 'thisIsSecret'
}

environments.production = {
  'port' : 5000,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoSecret'
}

const config = process.env.NODE_ENV !== 'production' ? environments.default : environments.production;

// Export Container
module.exports = config;
