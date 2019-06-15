const {setup, start} = require('../../index');
const app = require('express')();

process.env.NODE_ENV = 'production';

(async () => {
    await setup(app, {
        autoload: {
            actions: true,
            config: true,
            models: true
        },
        actions: {
            batch: true,
            handler: '/',
            list: '/'
        }
    });

    await start();
})();