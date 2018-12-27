const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {USER_STATUS_ACTIVE} = require('../constants');

/**
 * User model
 */

const schema = new Schema({
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
    locale: {
        type: String,
        required: true,
        defaultValue: 'en'
    },
     status: {
         type: Number,
         required: true,
         defaultValue: USER_STATUS_ACTIVE
     },
     role: {
         type: Schema.ObjectId,
         ref: 'Role'
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

schema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = schema;