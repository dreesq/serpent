const {config, plugin, Constants} = require('../index');

config({
    route: ['get', '/_dev_gateway'],
    enabled: process.env.NODE_ENV === 'development'
})(
    /**
     * The development gateway is enabled while environment is development
     * and is used by client to display server metrics along with live
     * action definition reloading
     *
     * @param req
     * @param res
     * @param events
     * @returns {Promise<void>}
     */

    async ({req, res, events}) => {
        const handle = data => {
            res.json(data);
            events.removeListener(Constants.GATEWAY_LOG, handle);
        };

        events.on(Constants.GATEWAY_LOG, handle);
    }
);
