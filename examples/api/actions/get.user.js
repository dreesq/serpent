const { config } = require('../../../index');

const withAuth = config({
     transports: [
          'socket',
          'http'
     ],
     middleware: [
          'auth',
          (req, res, next) => {
               next();
          }
     ],
     validate: {
          async id(value) {
               return !isNaN(value);
          }
     }
});

/**
 * Simple action for getting currently logged user
 */

module.exports = withAuth(async ({ user, db, input }) => {
     return await db.User.findOne(input.id);
});

