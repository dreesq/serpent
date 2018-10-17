const {setup, start} = require('../../index');
const express = require('express');
const app = express();

setup(app).then(start);