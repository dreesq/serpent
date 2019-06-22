const {get, action, config} = require('../../../index');

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

get('/test', async ({crypto}) => {
    const encrypted = await crypto.symetric.encrypt('AAA');
    return await crypto.symetric.decrypt(encrypted);
});