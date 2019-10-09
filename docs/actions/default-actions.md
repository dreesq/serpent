# Default Actions

Serpent comes with a couple of predefined actions, modifiable using the ```override``` action helper or possible to disable through configuration files.

#### Available actions

##### addDevice

Action is useful for storing an user's device in order to be used for sending notifications. This action requires user to be logged in so an authorization header must be included along the request. Type can be any integer, it's used to easier identify.

```js
const {data, errors} = await client.addDevice({
    token: 'token',
    type: 0
});
```

##### confirmUser

The confirm action is used to confirm an account, if using the authentication flow with `confirm: true`. This action would not be available otherwise.

```js
const {data, errors} = await client.confirmUser({
    token: 'token'
});
```

##### createUser

Action is used to create new accounts that can be authenticated using `local` provider.

```js
const {data, errors} = await client.createUser({
    name: 'name',
    email: 'email@email.com',
    password: 'password'
});
```

##### getTranslations

Get translations is being used by client library on bootstrap for storing server returned translations. Note that the available translations are being defined in configuration file in: `plugins.i18n.serveTranslations`. To enable this feature inside client library in ```i18n.load``` option. More on options can be found in [client documentation](/client/introduction).

##### getUser

Get user is used to check if an authentication token is valid and if it is, returns user's details.

```js
const {data, errors} = await client.getUser();
```

##### login

Login action is used to authenticate an user. Using the ``provider`` input, it returns an access token and if ``refresh`` is sent and plugin config enabled (`plugins.auth.refresh`), it also returns a refresh token used to request new access tokens if an action fails due of  access token being invalid. 

Note that refreshing is done automatically by library if `refresh: true` is passed in client options.

```js
const {data, errors} = await client.login({
    provider: 'local',
    email: 'email@email.com',
    password: 'password'
});

const {data, errors} = await client.login({
    provider: 'fb',
    accessToken: 'token'
});
```

Note that token management is done automatically using localStorage for both refresh and access tokens. You may modify storing behavior using tokenHandler like the following

```js
const storage = {};
const client = new Serpent({
    tokenHandler: {
      get(key) {
          return storage[key];
      },
      set(key, value) {
          storage[key] = value;
      },
      remove(key) {
          delete storage[key];
      }
    }
})
```

##### logout

Logout handles tokens removal along with session cleanup. Behind the scenes, it calls `tokenHandler.remove` function. More on that can be read in [authentication plugin page](/plugins/auth).

```js
const {data, errors} = await client.logout();
```

##### refreshToken

When called, it attempts to get a new user access token. Action is available only if `plugins.auth.refresh` is enabled.

Note that refresh token action is called automatically if `refresh: true` is passed in the client constructor. 

```js
const {data, errors} = await client.refreshToken({
    token: 'token'
});
```

##### resetPassword

Action is available only if ```plugins.auth.reset``` is enabled. Action is called for both requesting and handling the password change. An email containing a reset token is sent when `action` value is `0`.

```js
// request reset token on email
const {data, errors} = await client.resetPassword({
    action: 0,
    email: 'email@email.com'
});

// updates account password using received token
const {data, errors} = await client.resetPassword({
    action: 1,
    token: 'token', // email received token
    password: 'password'
});
```

##### sendConfirm

Action attempts to resend confirmation email to the authenticated user. Only available if ```plugins.auth.confirm``` is enabled.

```js
const {data, errors} = await client.sendConfirm();
```

##### setPassword

Given the old and new password, it attempts to change authenticated account's password. If successful, action returns new access token, new refresh token is also returned if `refresh` input is present.

Note that client library handles new access token change automatically when this action is called. Only available if ``plugins.auth.update`` is enabled

Note that all access tokens / refresh tokens are invalidated when account password is changed. Not the case for email change.

```js
const {data, errors} = await client.setPassword({
    old: 'old-password',
    new: 'new-password'
});
```

##### setEmail

Changes authenticated user's email. Only available if ``plugins.auth.update`` is enabled. A confirmation email containing a code will be sent to current user's email. That token must be sent in order to confirm email change.

```js
// request token on current email
const {data, errors} = await client.setEmail({
    action: 0,
    email: 'new@email.com'
});

// confirm email update
const {data, errors} = await client.setEmail({
    action: 1,
    token: 'token' // token from confirm email
});
```
