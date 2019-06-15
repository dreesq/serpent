# Helpers

The core library contains a few helpers that allow you to modify the lifecycle of an action and the also help improving code readability.

#### Action shorthands: action, get, post, del, put, update, head, options

These are shortcut functions that internally call ```config``` function. As of right now, they do not allow setting middlewares or input structure.

```js
const {get, post} = require('@dreesq/serpent');

get('/test', async ({req}) => `Hello World!`);
post('/test', async ({req}) => `Hello Post!`);
```

#### call

Allows you to call actions from outside actions context by passing custom payload along with custom context data. 

*Note:* When using `call`, action middlewares are not run.

```js
const {call, config} = require('@dreesq/serpent');

config({
    name: 'myAction'
})(
    async ({input, source, user}) => {
        // `input` will be the second argument
        // source === SOURCE_LOCAL when called using `call` utility,
        return 'myResult';
    }
);

const result = await call('myAction', {}, {user: ''}); // myResult

```

#### utils.autoFilter

The autoFilter utility allows to automatically create an action that handles collection filtering along with pagination.

```js
    const {utils, config} = require('@dreesq/serpent');

    config({
        name: 'filterUsers',
        middleware: [
            'auth:required'
        ],
        input: {
            filters: 'object',
            sorts: 'object',
            page: 'number'
        }
    })(
        utils.autoFilter('User', {
            fields: [
                'name',
                '-_id'
            ],
            limit: 5,
            restrictToUser: true,
            pagination: true,
            before(query, filters, ctx) {
                
            },
            after(data) {
                return data;
            }
        })
    )
```

The above example creates an action with name ```filterUsers``` that automatically deals with filtering the ```User``` collection.

The ```restrictToUser``` parameter attaches a ```where``` filter to ```userId``` is authenticated's user _id.

```limit``` is the number of documents returned per page

```fields``` is a list of returned fields or ignored fields.

```pagination``` defined if the returned result should be placed under a paginated structure.

```before``` receives the actual ```query``` and allows to further modify the request.

```after``` contains the database result and allows to modify the response.


#### utils.autoCrud

Given a collection, the autoCrud utility allows quickly creating all required crud actions/rest routes. In behind, the find route is using ```utils.autoFilter```.

```js
const {utils} = require('@dreesq/serpent');

utils.autoCrud('User', {
    fields: [
        '-_id'
    ],
    middleware: [
        'auth:required'
    ],
    path: '/user',
    restrictToUser: true,
    methods: [
        'create',
        'update',
        'find',
        'remove',
        'get'
    ],
    type: 'actions',
    allowNull: false,
    after(ctx, method, data) {
        return data;
    },
    before(ctx, method, filters) {
        return filters;
    }
});
```

Above example creates a total of 5 actions that can be called by doing requests on the handler route having the following action naming: `${method}Auto${collection}` so if I would like to create an user, I would do a POST request in the handler route with the following request payload.

```['createAutoUser', {name: 'user', password: 'password'}]```

```type``` parameter specify wether actions or rest routes should be created. If `type` value equals ```rest```, 5 routes would be created on following endpoints:

```
    create - POST - /${path}
    update - PUT - /${path}/:id
    find - GET - /${path}
    remove - DELETE - /${path}
    get - GET - /${path}/:id
```

The ```restrictToUser``` parameter attaches a ```where``` filter to ```userId``` is authenticated's user _id.

```allowNull``` prevents users to send _id filter with null value, preventing whole collection queries.

#### override

The override helper allows you to modify an action configuration object.

```js
    const {override} = require('@dreesq/serpent');
    
    override('createUser', options => ({
        ...options,
        input: {
            ...options.input,
            age: 'required|number'
        }
    }))

```

#### plugin

Plugin allows you to access core libraries from outside actions. Note that the helper should be used after ```setup```.

```js
const {plugin} = require('@dreesq/serpent');
const config = plugin('config');

console.log(config.get('debug'));
```

#### register

Used to register additional plugins

```js
const {register, plugin} = require('@dreesq/serpent');

register('myPlugin', {
    test() {
        return 'test';
    }
});

const myPlugin = plugin('myPlugin');
myPlugin.test();
```