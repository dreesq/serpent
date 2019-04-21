const {get} = require('../../../index');

get('/hello/:name/:count?', ({input, t}) => t('greeting', input));