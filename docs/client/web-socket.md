# Web Socket

The web socket plugin may be accessed using ``client.socket``. Under the hood, it extends `socket.io` adding new functionality.

In order for it to work, you must have enabled web sockets on server by having `plugins.socket` be present in server config.

You may pass a custom `socket.io` connection address in library constructor

```js
const client = new Serpent({
    sio: 'http://localhost:3031'
});

let authenticated = false;

client.setup().then(() => {
    client.socket.on('login', () => {
        authenticated = true;
    });
});
```

#### Methods

```client.socket.emit(event, payload)``` - Emits an event to the web socket server

```client.socket.on(events, callback)``` - On server received event, run callback

```client.socket.logout()``` - Logs out the socket

```client.socket.client``` - Access `socket.io` internal object

#### Authentication

If user is authenticated, the plugin handles automatically web socket authentication after server handshake by sending a `login` data frame along the JWT token. A `login` data frame response is received by server on successful authentication.

On client logout, the plugin automatically sends `logout` data frame to handle web socket logout.

