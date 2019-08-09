const {get, post, action, override, config, register, plugin, utils} = require('../../../index');

get('/hello/:name/:count?', ({input, t}) => t('greeting', input));

config({
    route: ['get', '/test5'],
    hooks: {

    },
    input: {

    }
})(
    async ({ options }) => options
);

get('/test-6', () => {
    undefined_variable
    return 1;
})

/*override('login', config => {
    config.hooks = {
        before(input) {
            console.log('hook called');
        }
    };

    return config;
});*/

config({
    name: 'test4',
    middleware: [

    ],
    input: utils.form({
        a: {
            label: 'A',
            placeholder: 'A',
            validation: 'required|number'
        }
    })
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
    const encrypted = await crypto.symmetric.encrypt('AAA');
    return await crypto.symmetric.decrypt(encrypted);
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

get('/stress-test', async ({db}) => {
    return await db.Task.create({
        title: 'XXX'
    });
});

register('myPlugin', {
    init(ctx) {

    },
    build(req, res, ctx) {
        return {
            random: 1
        }
    },
    methods: {
        random: 2
    }
});

get('/random-number', ({ myPlugin, logger }) => {
    const {json} = logger;
    const randomNumber = myPlugin.random + plugin('myPlugin').random;

    throw new Error('xxx');

    json({
        randomNumber,
        a: 1,
        b: 2,
        c: {
            e: 2,
            r: {
                e: {
                    z: 4
                }
            }
        }
    });

    return randomNumber;
});