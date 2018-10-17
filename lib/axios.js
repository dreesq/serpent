const axios = require('axios');
const client = axios.create();

/**
 * Export the requests client
 */

exports.methods = client;