const express = require('express');
const { Setup } = require('../../index');

const app = express();

Setup(app);
app.listen(3000, () => console.log('Listening on port 3000'));