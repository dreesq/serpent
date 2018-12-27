const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Role model
 */

module.exports = new Schema({
     name: {
          type: String,
          required: true,
          unique: true
     }
});

