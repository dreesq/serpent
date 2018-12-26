const {config} = require('../../../index');

config({
     name: 'getTasks',
     middleware: [
        'auth',
     ]
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ db, user }) => {
          return await db.Task.find({ userId: user._id });
     }
);

config({
    name: 'createTask',
    input: {
         title: 'string|required'
    },
    middleware: [
        'auth'
    ]
})(
     /**
      * A test action
      * @returns {Promise<{success: boolean}>}
      */

     async ({ db, user, input }) => {
          return await db.Task.create({
              ...input,
              userId: user._id
          });
     }
);