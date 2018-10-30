const {config} = require('../../../index');

config({
     route: {
          method: 'get',
          path: '/tasks'
     }
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ db, mail }) => {
          await mail({
               from: 'test@test.com',
               to: 'test@test.com',
               subject: 'Test 24 55',
               html: 'Hello world!'
          });

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