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
    facebookId: {
        type: Number
    },
    ts: {
        type: Number
    },
    locale: {
        type: String,
        required: true,
        default: 'en'
    },
    role: {
        type: Schema.ObjectId,
        default: null,
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
    },
    status: {
        type: Number,
        required: true,
        default: USER_STATUS_ACTIVE
    }
}, {
    timestamps: true
});

module.exports = schema;