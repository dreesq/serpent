const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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