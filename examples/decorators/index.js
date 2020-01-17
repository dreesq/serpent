const {start, setup, Action} = require('../..');
const app = require('express')();

setup(app).then(start);
