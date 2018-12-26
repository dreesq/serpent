(async () => {
    const {setup, start} = require('../../index');
    const express = require('express');
    const app = express();

    await setup(app);
    start();
})();