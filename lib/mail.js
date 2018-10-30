const nodemailer = require('nodemailer');

/**
 * The email client
 */

let client = false;

/**
 * Email module
 * @param context
 */

module.exports = context => {
     const {config} = context.plugins;

     if (!client) {
          client = nodemailer.createTransport(config.get('plugins.mail'));
     }

     return async (payload) => {
          return await client.sendMail(payload)
     };
};

/**
 * Exported methods
 * @type {{}}
 */

/*
exports.methods = {
     async mail(payload) {

     }
};*/
