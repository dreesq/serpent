# Helpers

The core library contains a few helpers that allow you to modify the lifecycle of an action and the also help improving code readability.

#### Action shorthands: action, get, post, del, put, update, head, options

These are shortcut functions that internally call ```config``` function. As of right now, they do not allow setting middlewares or input structure.

```js
const {get, post} = require('@dreesq/serpent');

get('/test', async ({req}) => `Hello World!`);
post('/test', async ({req}) => `Hello Post!`);
```

#### utils.autoFilter

The autoFilter utility allows to automatically create an action that handles collection filtering along with pagination.

```js
    const {utils, config} = require('@dreesq/serpent');

    config({
        action: 'filterUsers',
        middleware: [
            'auth'
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

The ```restrictToUser``` parameter adds attaches a ```where``` filter to ```userId``` is authenticated's user _id.

```limit``` is the number of documents returned per page

```fields``` is a list of returned fields or ignored fields.

```pagination``` defined if the returned result should be placed under a paginated structure.

```before``` receives the actual ```query``` and allows to further modify the request.

```after``` contains the database result and allows to modify the response.


#### utils.autoCrud

@TODO

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