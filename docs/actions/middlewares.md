# Middlewares

Serpent comes out of the box with a couple of useful middlewares. Middlewares may be registered in actions using the middleware option.

```js
    const {config} = require('@dreesq/serpent');
    
    config({
        name: 'myAction',
        middleware: [
            'auth:required'
        ]
    })('Result');
```

Above example would not allow action to return its result if the request does not contain a valid `Authorization` JWT header.

#### Available middlewares

##### auth

Attempts to authenticate the user if ``Authorization`` header is present. If ```required``` option is present, middleware will return ```403``` status if not logged, preventing action handler from being called.

```js
    const {config} = require('@dreesq/serpent');
    
    config({
        name: 'getUser',
        middleware: [
            'auth:required'
        ]
    })(
        async ({user}) => user
    );
```

##### can

##### is

##### limit

##### upload

### Custom middlewares

You may pass custom middlewares by defining custom functions within the middleware array or if using the autoload functionality, by creating a new file and then registering it by using its file name.

```js
    const {config} = require('@dreesq/serpent');

    config({
        name: 'myAction',
        middleware: [
            'auth:required',
            (req, res, next) => {
                console.log('Middleware called.');
                next();
            },
            (req, res, next) => {
                next('Middleware failed.');
            },
            (req, res, next) => {
                console.log('Won\'t be called.');
                next();
            }
        ]
    })('Result');
```

If auto load is enabled, middlewares are loaded on application bootstrap and can be called using string representation like following:

```js
    // middlewares/myMiddleware.js
    module.exports = options => {
        return (req, res, next) => {
            console.log(options[0], options[1]);
            next();
        }
    }
    
    // action.js
    const {config} = require('@dreesq/serpent');
    
    config({
        name: 'action',
        middleware: [
            'myMiddleware:1,2,3',
            'myMiddleware:5,5,8',
        ]
    })(
        async () => {
            return '1'
        }
    );
```

Above example would log ```1``` ```2``` ```5``` ```5``` in console.
