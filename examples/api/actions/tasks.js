const {config} = require('../../../index');

config({
     route: {
          method: 'get',
          path: '/tasks'
     },
     input: {
          a: 'number|min:23|max:55'
     }
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ db }) => {
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