const {get, post, action, override, config, register, plugin, utils} = require('../../../index');

get('/hello/:name/:count?', ({input, t}) => t('greeting', input));

action(
    'hello',
    async ({ input, db }) => {
        return `Hello ${input.name}!`;
    },
    {
        name: 'required|string'
    }
);

config({
    route: ['post', '/test5'],
    hooks: {

    },
    input: {
        d: 'required',
        a: {
            z: 'required|number',
            b: {
                e: 'required|number'
            }
        }
    }
})(
    async ({ options, input }) => input
);

action('test-6', () => {
    return {
        test: true,
        test2: false
    };
});

config({
    route: ['get', '/test23'],
    middleware: [
        'auth:required|source:query|key:token'
    ],
    input: utils.form({
        a: {
            label: 'A',
            placeholder: 'A',
            validation: 'required|number'
        }
    })
})(
    async ({input, user}) => {
        return user || 'NO USER';
    }
);

action('secondAction', 'secondResult');
action('thirdAction', () => { throw new Error('Unknown error') });

get('/test-2', async ({ stripe }) => {
    return await stripe.products();
});

config({
    route: ['get', '/test'],
    input: {
        content: 'required|string|min:3'
    }
})(
    async ({input, t}) => {
        const i18n = plugin('i18n');
        await i18n.setTranslation('en', 'validation.required', input.content);
        return t('validation.required');
    }
);

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

config({
    route: ['post', '/test'],
    middleware: [
        'upload:file,storage/uploads,10 mb'
    ]
})(
    async ({input}) => {
        return input;
    }
);
