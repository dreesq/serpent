const {config} = require('../../../index');


config({
     route: {
          method: 'get',
          path: '/user/me'
     },
     input: {
          name: 'string',
          id: 'required|number'
     }
})(
     /**
      * A test action
      * @param user
      * @returns {Promise<{success: boolean}>}
      */

     async ({ user }) => {
          return {
               success: true
          };
     }
);