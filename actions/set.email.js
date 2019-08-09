const {config, getPlugins} = require('../index');
const {error, success, makeToken} = require('../utils');
const {config: configPlugin} = getPlugins();
const {
    ACTION_REQUEST,
    ACTION_HANDLE,
    TOKEN_TYPE_UPDATE_EMAIL,
} = require('../constants');

config({
    name: 'setEmail',
    input: {
        action: 'required|number',
        email: 'email|when:action,0',
        token: 'when:action,1|min:64'
    },
    middleware: [
        'auth:required'
    ],
    enabled: configPlugin.get('plugins.auth.update')
})(
    /**
     * Changes user's account
     * @param db
     * @param user
     * @param mail
     * @param input
     * @param crypto
     * @param t
     * @param utils
     * @returns {Promise<void>}
     */

    async ({db, user, mail, crypto, input, utils, t}) => {
        const {User, Token} = db;

        if (+input.action === ACTION_REQUEST) {
            const token = await makeToken();

            await Token.deleteMany({
                userId: user._id,
                type: TOKEN_TYPE_UPDATE_EMAIL
            });

            await Token.create({
                userId: user._id,
                type: TOKEN_TYPE_UPDATE_EMAIL,
                token: await crypto.hash(token),
                extra: {
                    email: input.email
                }
            });

            await mail({
                to: input.email,
                subject: t('emails.emailChangeRequested.subject'),
                html: t('emails.emailChangeRequested.html', {
                    url: utils.url('update', {token}),
                    user
                })
            });

            return success(t('messages.emailChangeRequested'));
        }

        if (+input.action === ACTION_HANDLE) {
            const token = await Token.findOne({
                token: await crypto.hash(input.token),
                type: TOKEN_TYPE_UPDATE_EMAIL
            });

            if (!token) {
                return error(t('errors.invalidToken'));
            }

            await User.updateOne({_id: token.userId}, {
                email: token.extra.email
            });

            await token.remove();
            return success(t('messages.emailChanged'));
        }
    }
);