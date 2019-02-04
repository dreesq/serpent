const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_REFRESH} = require('../constants');
const {success} = require('../utils');
const {config: configPlugin} = getPlugins();
const moment = require('moment');

config({
    name: 'logout',
    middleware: [
        'auth'
    ],
    enabled: configPlugin.get('plugins.auth')
})(
    /**
     * Logout action
     * @param user
     * @param db
     * @returns {Promise<void>}
     */

    async ({user, db}) => {
        const {Token, User} = db;

        await Token.deleteOne({
            userId: user._id,
            type: TOKEN_TYPE_REFRESH,
            guid: user.token.guid
        });

        await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                ts: moment().unix()
            }
        });

        return success();
    }
);