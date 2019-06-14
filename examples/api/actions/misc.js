const {get, action} = require('../../../index');

get('/hello/:name/:count?', ({input, t}) => t('greeting', input));

action('firstAction', 'firstResult');
action('secondAction', 'secondResult');