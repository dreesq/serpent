const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Device model
 */

module.exports = new Schema({
    userId: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    token: {
        type: String
    },
    type: {
        type: Number,
        required: true
    },
    description: {
        type: String
    }
});

