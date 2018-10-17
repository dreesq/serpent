const {config} = require('../../../index');

config({
     route: {
          method: 'get',
          path: '/tasks'
     },
     input: {
          name: 'required|string',
     }
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ input: { name }, db }) => {
          return await db.Task.find();
     }
);

config({
     route: {
          method: 'get',
          path: '/tasks/:title'
     },
     input: {
          title: 'required|string',
     }
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ input, db }) => {
          return await db.Task.create(input);
     }
);