const {utils} = require('../../../index');

utils.autoCrud('Task', {
    before(ctx, method, filters) {
        return filters;
    },
    after(ctx, method, data) {
        return data;
    }
});