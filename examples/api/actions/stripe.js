const {action} = require('../../../index');

action('getProducts', ({stripe}) => stripe.products());