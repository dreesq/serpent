const { configure } = require('../../../index');

/**
 * Simple action for getting currently logged user
 */

module.exports = configure({
     route: {
          method: 'GET',
          path: '/test/stuff'
     },
     middleware: ['auth'],
     validate: {}
})(async ({ user, req, res }) => {
     return user;
});

