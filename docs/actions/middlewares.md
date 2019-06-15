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

##### can

##### is

##### i18n

##### limit

##### upload

#### Custom middlewares

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