const {get} = require('../../../index');

get('/hello/:name', ({input}) => `Hello ${input.name}!`);