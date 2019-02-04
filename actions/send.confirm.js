const {config, getPlugins} = require('../index');
const {config: configPlugin} = getPlugins();
const {TOKEN_TYPE_CONFIRM, USER_STATUS_INACTIVE} = require('../constants');
const {error, makeToken} = require('../utils');

config({
    name: 'sendConfirm',
    middleware: [
        'auth'
    ],
    enabled: configPlugin.get('plugins.auth.confirm'),
})(
    /**
     * Resend user activation code
     * @param db
     * @param mail
     * @param user
     * @param i18n
     * @param utils
     * @returns {Promise<void>}
     */

    async ({db, mail, user, i18n, utils}) => {
        const t = i18n.translate;

        if (user.status !== USER_STATUS_INACTIVE) {
            return error(t('errors.alreadyConfirmed'));
        }

        const token = await makeToken();

        await db.Token.findOneAndUpdate({
            userId: user._id,
            type: TOKEN_TYPE_CONFIRM
        }, {
            $set: {
                token
            }
        });

        await mail({
            to: user.email,
            subject: t('emails.confirmAccount.subject'),
            html: t('emails.confirmAccount.html', {
                user,
                url: utils.url('confirm', {token})
            })
        });

        return success();
    }
);