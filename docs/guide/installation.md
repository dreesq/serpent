# Installation

The framework is built with modern javascript in mind and because of that we recommend a later node version such as ```10.x```.

Serpent is built to wrap the ```express``` package for maximum extensibility and because of that you should also install express by running ```npm install express``` command.

The latest version of the framework is hosted on npm and can be installed by running ``npm install @dreesq/serpent`` and for the client component ```npm install @dreesq/serpent-client```


### Bootstraping

Once installed, you may bootstrap the application using the following code:

```js
const express = require('express');
const {setup, start} = require('@dreesq/serpent');

const options = {
    actions: {
        handler: false,
        list: false  
    },
    autoload: {
        models: false,
        actions: false,
        middlewares: false,
        config: false
    },
    onError: e => {
        
    }
};

const app = express();

(async () => {
    await setup(app, options);
    await start(); // or app.listen(3000);
})();
```

### Options
From the above example you may notice the auto load options. By default, the framework tries to auto load models, actions, middlewares and config files. 

The auto load value should be the folder path, if left true (by default), it will look for ```models```, ```actions```, ```config```, ```middlewares``` folder inside the application root path.

You may use ```options.config``` to specify the path of the configuration file. We recommend to keep use the auto load functionality as it also handles environment isolation.

The ```options.onError``` function is called whenever the application encounters an error. It can be considered same as an error middleware.

The ```options.actions``` parameter dictates on if framework actions should be used. More on actions can be found in [here](/actions/introduction).