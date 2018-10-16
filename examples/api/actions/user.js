const {config} = require('../../../index');

config({
     route: {
          method: 'get',
          path: '/user/:name'
     },
     input: {
          name: 'string',
          id: 'required|number'
     }
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ input }) => {
          if (input.name !== 'me') {
               throw new Error('Input is not me.');
          }

          return {
               name: 'Me'
          }
     }
);