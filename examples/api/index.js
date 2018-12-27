(async () => {
    //process.env.NODE_ENV = 'production';

    const {setup, start} = require('../../index');
    const express = require('express');
    const app = express();

    await setup(app);
    await start();
})();