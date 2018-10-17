const {config} = require('../../../index');

config({
     route: {
          method: 'get',
          path: '/user/:name'
     },
     input: {
          name: 'required|string',
     }
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ input: { name }, axios }) => {
          return {
               name
          };
     }
);