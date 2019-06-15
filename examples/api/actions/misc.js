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