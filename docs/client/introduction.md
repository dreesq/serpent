# Introduction

The client component eases communication between client ad server and also provides useful helpers such as the debug console.

#### Setup

Client does not include any dependency but require `axios` and `socket.io-client`, if used, to must be passed to the instance constructor.

You may install the latest version of the client using ``npm install @dreesq/serpent``.

Once installed, you can ```import``` or direct include through script tag, the built package.

```js
import Serpent from '@dreesq/serpent-client';
import axios from 'axios';
import sio from 'socket.io-client';

const client = new Serpent({
    handler: 'http://localhost:3001/handler',
    actions: 'http://localhost:3001/actions',
    axios,
    sio
});

client.setup();

// Client is now ready, note that the setup method is a promise
```

#### Options

The client configuration object allows the following options:

##### debug: `true | false`

Additional logs and metrics are done by the library if debug is enabled.

##### socket: `true | false`

If enabled, a socket connection will be created to the server. Connection will also be authenticated if user is logged.

##### actions: `string`

The path from where actions are loaded and initialized inside the client library. If false, the setup method will not load any actions, useful for server side rendering.

##### handler: `string`

Path where actions are being run.

##### refresh: `boolean`

If true, the client library will attempt to refresh the token and retry the action call if an action run fails due of an invalid token. More on authentication flow can be read in the [authentication plugin](/plugins/auth) page.

##### authFailed: `function`

If provided, authFailed is called each time a request fails to run because of authentication issues.

##### i18n: `object`

Defines which translations should be loaded. Note that these can also be validated from the server side, in the ```getTranslations``` action.

```js
    const options = {
        i18n: {
            // List of loaded translations. If authenticated, 
            // loads user's language translations
            load: [ 
                'messages',
                'user.login.success'
            ],
            // If translations should be stored in localStorage
            store: true 
        }
    };
```

##### tokenHandler: `object`

The tokenHandler deals with auth tokens manipulation. The handler can be used for server side rendered applications like the following:

```js
import {parseCookies, setCookie, destroyCookie} from 'nookies';

const cookies = parseCookies();

const options = {
    tokenHandler: {
        get(key) {
            return cookies[key];
        },
        set(key, value) {
            setCookie(null, key, value, {});
        },
        remove(key) {
            destroyCookie(null, key);
        }
    }
}
```

#### Debug

To easier debug the application, the library comes with a debug panel that offers useful insights and benchmarking.

To turn the debugPanel open, you only need to pass ```debug: true``` and after setup, run ```client.debugPanel()``` like following:

```js
import Serpent from '@dreesq/serpent-client';

const client = new Serpent(path, {
    debug: true
});

client.setup().then(() => client.debugPanel());
```
