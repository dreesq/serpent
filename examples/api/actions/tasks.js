const {config} = require('../../../index');

config({
    name: 'getTasks',
    input: {
        page: 'number'
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
        const limit = 5;
        const skip = (input.page - 1 || 0) * limit;

        const get = db.Task.find({userId: user._id}).skip(skip).limit(limit);
        const count = db.Task.count();

        const [data, total] = await Promise.all([get, count]);

        return {
            data,
            total
        };
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