const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Token model
 */

module.exports = new Schema({
    userId: {
        type: Schema.ObjectId,
        ref: 'User',
        index: true
    },
    token: {
        type: String,
        index: true
    },
    guid: {
        type: String,
        index: true
    },
    type: {
        type: String,
        index: true,
        required: true
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date,
        required: true,
        default() {
            return new Date();
        }
    }
});