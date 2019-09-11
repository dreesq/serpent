const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_REFRESH} = require('../constants');
const {success, error} = require('../utils');
const {config: configPlugin} = getPlugins();
const bcrypt = require('bcryptjs');
const moment = require('moment');

config({
    name: 'setPassword',
    input: {
        old: 'required|string|min:10',
        new: 'required|string|min:10',
        ...(configPlugin.get('plugins.auth.refresh') ? {refresh: 'number'} : {})
    },
    middleware: [
        'auth:required'
    ],
    enabled: configPlugin.get('plugins.auth.update')
})(
    /**
     * Changes currently logged in user password
     * @param db
     * @param user
     * @param config
     * @param auth
     * @param input
     * @param mail
     * @param t
     * @returns {Promise<void>}
     */

    async ({db, config, user, auth, mail, input, t}) => {
        const {User, Token} = db;
        const ok = await bcrypt.compare(input.old, user.password);

        if (!ok) {
            return error(t('messages.invalidOldPassword'));
        }

        const password = await bcrypt.hash(input.new, 10);
        const ts = moment().unix();

        await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                password,
                ts
            }
        });

        await Token.deleteMany({
            userId: user._id,
            type: TOKEN_TYPE_REFRESH
        });

        if (config.get('plugins.auth.notify')) {
            await mail({
                to: input.email,
                subject: t('emails.accountReset.subject'),
                html: t('emails.accountReset.html', {
                    user
                })
            });
        }

        user.ts = ts;

        const result = {
            message: t('messages.passwordChanged'),
            ...await auth.authenticateUser(user, input.refresh)
        };

        return success(result);
    }
);
