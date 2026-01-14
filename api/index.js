// api/index.js
const serverless = require('serverless-http');
const app = require('../app');

// Export handler for Vercel
module.exports = serverless(app);
