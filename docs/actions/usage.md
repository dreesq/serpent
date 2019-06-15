# Usage

All actions are defined using the ```config``` helper. The config helper takes a configuration object and in behind, it generates a handler inside the router library.

Actions can be setup to be called from the ```handler``` endpoint or from a http endpoint.

In order to be valid, actions require either ```name``` or ```route``` parameter to exist.

Actions may either run a handler function or return static data.

```js
const {config, get} = require('@dreesq/serpent');

config({name: 'myAction'})('Result');

get('/my-action', {
    result: 1
});

get('/dynamic-action', async () => {
    return new Date();
});
```

Above are 3 actions defined, first 2 returning static content while last one runs its async handler returning dynamic content. Note that `get` is an action shorthand, more on that can be found in [here](/actions/helpers).

### Creating Actions

#### Named action

The named action may be called from the ```handler``` endpoint, by doing a POST request with data structured like ```['myAction', {}]```. Named actions are also exposed in ```list``` endpoint. To make them invisible, you may add ```visibile: false``` to the config object.

Here's an example of a basic action that just returns a string.

```js
    // File path: actions/test.js, auto loaded actions: true
    const {config} = require('dreesq/serpent');

    config({
        name: 'myAction'
    })(
        async ({req, res}) => {
            return 'Hello World!';
        }
    );
```

#### Routed actions

You may specify the route for an action by adding the ```route``` parameter of structure ```[method, path]``` like the following:

```js
    // File path: actions/test.js, auto loaded actions: true
    const {config} = require('dreesq/serpent');

    config({
        route: ['get', '/do-something']
    })(
        async ({req, res}) => {
            return 'Hello World!';
        }
    );
```

### Input

The input object defines the input structure an action expects and also allows, double side validation if using the client library. More on the input plugin may be read in [the plugins page](/plugins/input).

Here's a basic example of action containing input structure:

```js
    config({
        name: 'greet',
        input: {
            name: 'required|string',
            async theo(value, all) {
                if (all.name !== 'theo') {
                    return 'validation.notTheo';
                }
            }
        }
    })(
        async ({input}) => {
            return `Greetings ${input.name}!`;
        }
    );
```

*Note:* Initially, the input context object contains merged data from: request body, route parameters and request query string. If the input structure is present, the input context object will discard keys not defined in the structure. If no input structure is given, all data will be available into the input context object.

Above example may be called by doing a POST request to the ```handler``` path with data following this structure: ```['greet', {name: 'Theo'}]```

Action will be **auto validated**, a translated message will be returned in case the validator fails. More on validation may be read in [the plugins page](/plugins/input). 

Additional validation rules may be found in [here](/plugins/validation).

### Middlewares

Middlewares are another important aspect of the framework. The framework provides quite a few useful middlewares that can be read in [here](/actions/middlewares).

Here's a quick example on how an action containing middlewares would look like:

```js
    config({
        name: 'greet',
        input: {
            name: 'required|string'
        },
        middleware: [
            'auth:required',
            'is:admin',
            'can:greet',
            'limit:5'
        ]
    })(
        async ({user}) => {
            return `Greetings ${user.name}!`
        }
    )
```

The above action would run, only if the authenticated user has ```admin``` role, has ```greet``` permission and is only allowed to be called 5 times every minute.

### Context

You may have noticed the properties that are being injected inside the action handlers. Based on enabled plugins, each action call will receive an object allowing access to different plugins methods.

Following is a more advanced action definition that better uses the context:

```js
    config({
        name: 'greet',
        middleware: [
            'auth:required',
        ]
    })(
        async ({user, db, t, source, redis}) => {
            await db.User.updateOne({_id: user._id}, {greeted: true});
            await redis.set('greeted', 'true');
            
            return t('greeting', user);
        }
    )
```

Note that 'source' parameter will either have the value 0 (SOURCE_LOCAL) or 1 (SOURCE_REMOTE) based from where action is called. Calling it from within the code will make 'source' parameter to have the value 0 (SOURCE_LOCAL).

Depending on the enabled plugins, all the available properties are the following: [user](/plugins/auth), [db](/plugins/db), [firebase](/plugins/firebase), [redis](/plugins/redis), [es](/plugins/es), [t](/plugins/i18n), [i18n](/plugins/i18n), [events](/plugins/events), [mail](/plugins/mail), [axios](/plugins/axios), [validator](/plugins/validator), [socket](/plugins/socket), [stripe](/plugins/stripe), [input](/plugins/input), req, res, [utils](/plugins/utils), [config](/plugins/config). 

More information for each available property can be read in its plugin page.