# Auth

The authentication plugin eases user authentication and authorization flows by offering automated token refresh and management. Below is a full authentication flow example. 

Note that auth must be enabled on the server component. More on server auth plugin can be read in the [auth plugin documentation](/plugins/auth).

```js
const {data, errors} = await client.createUser({
    name: 'Name',
    email: 'me@me.com',
    password: 'password'
});

if (errors) {
    return;
}

const {data, errors} = await client.login({
    provider: 'local',
    email: 'me@me.com',
    password: 'password'
});

if (errors) {
    return;
}

// User authenticated successfully
console.log(client.auth.user);
// You may use authorization helpers
console.log(client.auth.can('doSomething'), client.auth.is('admin'));

// Logout the user
const {data, errors} = await client.logout();

// User is now logged out with tokens removed
```

### Client config
Authentication flow may be modified inside the client constructor as following:

```js
import Serpent from '@dreesq/serpent-client';

const client = new Serpent({
    refresh: true,
    tokenHandler: {
      get(type) {
          localStorage.getItem(type);
      },
      set(key, value) {
          localStorage.setItem(key, value)
      },
      remove(key) {
          localStorage.removeItem(key)
      }
    },
    authFailed: () => {
        
    }
});
```

### Refresh token

Refreshing token is attempted each time an action that requires authentication (auth:required middleware) returns 401 response status. In order for it to work, it must also be enabled server side by setting ```plugins.auth.refresh```. If token was refreshed successfully, the failing action is reattempted.

### Other options

#### `authFailed`

The authFailed function is called whenever the user has to be reauthenticated / authenticated. Function is also called if refresh token fails for any reason.

#### `tokenHandler`

By default tokens are stored inside localStorage. You may modify this behaviour by defining a new tokenHandler.
