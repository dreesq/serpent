const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * User model
 */

module.exports = new Schema({
     email: {
          type: String
     }
});