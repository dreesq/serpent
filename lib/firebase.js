const firebase = require('firebase-admin');
const path = require('path');
const {APP_PATH} = require('../constants');

/**
 * Firebase client
 * @type {boolean}
 */

let client = false;

/**
 * Firebase plugin
 * @param context
 */

exports.init = context => {
    const {config} = context.plugins;

    const firebaseConfig = config.get('plugins.firebase');
    const credential = require(path.join(APP_PATH, firebaseConfig.credential));

    client = firebase.initializeApp({
        ...firebaseConfig,
        credential: firebase.credential.cert(credential)
    });
};

/**
 * Exported methods
 */

exports.build = () => {
    return client;
};