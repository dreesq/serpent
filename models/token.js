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
    type: {
        type: String,
        index: true,
        required: true
    },
    token: {
        type: String,
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