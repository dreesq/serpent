const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Permission model
 */

module.exports = new Schema({
     roleId: {
          type: Schema.ObjectId,
          ref: 'Role'
     },
     name: {
          type: String,
          required: true,
          unique: true
     }
});