const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Translation model
 */

module.exports = new Schema({
    key: {
        type: String,
        index: true
    },
    app: {
        type: String,
        index: true
    },
    locale: {
        type: String,
        index: true
    },
    content: {
        type: String
    }
});
