const {config, utils} = require('../../../index');

config({
    name: 'getTasks',
    input: {
        filters: 'object'
    }
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
    name: 'getLastTask',
    middleware: [
        'auth'
    ]
})(
    async ({redis}) => {
         const task = await redis.get('lastTask');
         return JSON.parse(task);
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

    async ({db, user, redis, input}) => {
        const task = await db.Task.create({
            ...input,
            userId: user._id
        });

        await redis.set('lastTask', JSON.stringify(task));
        return task;
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