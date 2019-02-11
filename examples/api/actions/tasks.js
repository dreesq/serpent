const {utils, config} = require('../../../index');

utils.autoCrud('Task', {
    fields: [
        '-_id',
        'title'
    ],
    before(ctx, method, filters) {
        return filters;
    },
    after(ctx, method, data) {
        return data;
    }
});

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