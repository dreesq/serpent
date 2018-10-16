const { config } = require('../../../index');


config({
     name: 'getUser',
     route: {
          method: 'POST',
          path: '/user/me'
     },
     middleware: [
          'auth',
          'is:user,admin',
          'can:get-user',
          (req, res, next) => {

          }
     ]
})(
     async ({ user }) => {
          return user;
     }
);