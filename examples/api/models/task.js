const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Task Schema
 */

module.exports = new Schema({
     title: {
          type: String,
          required: true
     },
    userId: {
          type: Schema.ObjectId,
        references: 'user'
    }
});