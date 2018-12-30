const {config, utils} = require('../../../index');

config({
    name: 'getTasks',
    input: {
        filters: 'object'
    },
    middleware: [
        'auth'
    ]
})(
    utils.autoFilter('Task', {
        restrictToUser: true,
        pagination: true,
        limit: 2,
        transform(data) {
            return data;
        }
    })
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

    async ({db, user, input}) => {
        return await db.Task.create({
            ...input,
            userId: user._id
        });
    }
);

config({
    name: 'deleteTasks',
    middleware: [
        'auth'
    ]
})(
    async ({user, db}) => {
        return await db.Task.remove({userId: user._id});
    }
);