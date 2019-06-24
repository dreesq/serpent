const {get, post, action, config, utils} = require('../../../index');

get('/hello/:name/:count?', ({input, t}) => t('greeting', input));

config({
    name: 'firstAction',
    middleware: [

    ],
    input: {
        a: 'string|required'
    }
})(
    async ({input}) => {
        return input;
    }
);

action('secondAction', 'secondResult');
action('thirdAction', () => { throw new Error('Unknown error') });

get('/test-2', async ({ stripe }) => {
    return await stripe.products();
});

get('/test', async ({crypto}) => {
    const encrypted = await crypto.symetric.encrypt('AAA');
    return await crypto.symetric.decrypt(encrypted);
});

post('/stripe', utils.stripeHook({
    async onSubscribe(data, ctx) {

    },

    async onUnsubscribe(data, ctx) {

    },

    async onEvent(type, data, ctx) {

    },

    async onRefund(data, ctx) {

    }
}));

action('testAction', async ({ input }) => input);

get('/test-action', async ({ input }) => {
    return await Promise.all([1, 2, 3].map(i => call('testAction', {
        input,
        i
    })));
});

get('/stress-test', async ({db}) => {
    return await db.Task.create({
        title: 'XXX'
    });
});