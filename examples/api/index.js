(async () => {
    //process.env.NODE_ENV = 'production';

    const {setup, start} = require('../../index');
    const express = require('express');
    const app = express();

    await setup(app, {
        autoload: {
            actions: true,
            config: true,
            models: true
        }
    });

    await start();
})();