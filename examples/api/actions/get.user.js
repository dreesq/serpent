const { Action } = require('../../../index');

const withAuth = Action({
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
     await db.User.findOne(input.id);
     return user;
});

