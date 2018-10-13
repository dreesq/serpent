const express = require('express');
const { setup } = require('../../index');

const app = express();

setup(app);
app.listen(3000, () => console.log('Listening on port 3000'));