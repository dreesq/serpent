const {config, getPlugins} = require('../index');
const {config: configPlugin} = getPlugins();
const {success} = require('../utils');

config({
    name: 'addDevice',
    input: {
        token: 'required|string',
        type: 'required|number'
    },
    middleware: [
        'auth:required'
    ],
    enabled: configPlugin.get('plugins.auth.devices')
})(
    /**
     * Adds a device to the current logged user
     * @param input
     * @param db
     * @param user
     * @param t
     * @returns {Promise<{success}>}
     */

    async ({input, db, user, t}) => {
        const {Device} = db;

        await Device._create({
            ...input,
            userId: user._id
        });

        return success(t('messages.addDevice'));
    }
);