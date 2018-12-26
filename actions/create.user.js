const {config} = require('../index');
const {TOKEN_TYPE_CONFIRM, USER_STATUS_INACTIVE} = require('../constants');
const {makeToken, success} = require('../lib/utils');
const bcrypt = require('bcrypt');

config({
    name: 'createUser',
    input: {
        email: 'required|string',
        password: 'required|string',
        name: 'required|string'
    }
})(

    /**
     * Default login action
     * @param db
     * @param input
     * @param config
     * @param mail
     * @returns {Promise<void>}
     */

    async ({ db, mail, config, input }) => {
        const {User, Token} = db;
        const confirm = config.get('plugins.auth.confirm');

        input.password = await bcrypt.hash(input.password, 10);
        confirm && (input.status = USER_STATUS_INACTIVE);

        const user = await User.create(input);

        if (confirm) {
            const token = await makeToken();

            await Token.create({
                userId: user._id,
                type: TOKEN_TYPE_CONFIRM,
                token
            });

            await mail({
                to: input.email,
                subject: 'Confirm Account',
                body: token
            });
        }

        return success();
    }
);

