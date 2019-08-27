const {utils, config, get, action, call} = require('../../../index');

utils.autoCrud('Task', {
    fields: [
        '_id',
        'title'
    ],
    schema: utils.form({
        title: {
            label: 'Title',
            validation: 'required|string|min:2'
        }
    }),
    before(ctx, method, filters) {
        return filters;
    },
    after(ctx, method, data) {
        return data;
    }
});

config({
    route: [
        'get',
        '/path'
    ],
    input: {
        name: 'required'
    }
})(
    async ({ input }) => {
        const {name} = input;

        return {
            name
        };
    }
);

config({
    name: 'getATasks',
    middleware: [
        'auth'
    ]
})(
    utils.autoFilter('Task', {
        fields: [
            'title'
        ],
        pagination: true,
        before(query) {
            query.where('title', 'A')
        }
    })
);

get('/tasks/notify', async ({ firebase }) => {
    return await firebase.messaging().send({
        data: {
            task: "1"
        },
        topic: 'tasks'
    });
});

