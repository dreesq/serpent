const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Log model
 */

module.exports = new Schema({
    level: {
        type: String,
        index: true
    },
    message: {
        type: String,
    },
    meta: {
        type: Object,
    },
    timestamp: {
        type: Date
    }
});
