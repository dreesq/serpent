const {config} = require('../index');

config({
    route: ['GET', '_dev_gateway'],
    enabled: process.env.NODE_ENV === 'development'
})(
    async ({req, res}) => {
        res.end();
    }
);