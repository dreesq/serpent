const Serpent = require('../../index');

process.env.NODE_ENV = 'production';

(async () => {
    await Serpent.standalone({
        autoload: {
            actions: true,
            config: true,
            models: true
        },
        actions: {
            batch: true
        }
    });

    const {action, call, plugin} = Serpent;
    action('testAction', () => { throw new Error('X') });
    action('secondAction', 'Result');

    const {info} = plugin('logger');

    {
        const {errors, data} = await call('testAction');
        info(errors);
    }

    {
        const {errors, data} = await call('secondAction');
        info(data);
    }
})();