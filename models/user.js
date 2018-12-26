const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {USER_STATUS_ACTIVE} = require('../constants');

/**
 * User model
 */

module.exports = new Schema({
     email: {
          type: String,
          unique: true,
          trim: true,
          lowercase: true
     },
     name: {
          type: String,
          required: true
     },
     password: {
          type: String,
          required: true
     },
     status: {
         type: Number,
         required: true,
         defaultValue: USER_STATUS_ACTIVE
     },
     role: {
          type: Schema.ObjectId
     },
     permissions: {
          type: [
               {
                    type: Schema.ObjectId,
                    ref: 'Permission'
               }
          ],
          default: []
     }
});