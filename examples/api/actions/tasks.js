const {config} = require('../../../index');

config({
     name: 'getTasks'
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
          path: '/tasks'
     }
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ db, mail, socket }) => {
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

     async ({ input, user, db }) => {
          return await db.Task.create(input);
     }
);