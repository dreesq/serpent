# Events

The library ships with a fully featured event emitter allowing the developer to hook into various methods. The available events can be accessed from the library constants and may be used using the client event emitter ```client.events```.

Below is an example on how to emit and receive events anywhere inside the application.

```js
import Serpent, {Constants} from '@dreesq/serpent-client';
import axios from 'axios';

const client = new Serpent({
   axios,
   handler: 'https://localhost:3000',
   actions: 'https://localhost:3000'
});

await client.setup();

client.events.on('hello', console.log);
client.events.emit('hello', 'world');
client.events.removeListener('hello', console.log);

const multi = client.events.multi({
    hello: console.log,
    world: console.log
});

multi.unbind();

client.events.once('hello', console.log);
```

### Built in events

The library offers a couple of events that can be used to hook in core functionality. The events are the following:

#### ```Constants.LOADING_START```
The loading event is used to check the state of an action. ```loading``` must be passed inside the action call handler for it to emit.

```js
client.events.on(Constants.LOADING_START, ([action, payload]) => console.log(`Doing action ${action} with payload`, payload));
const {data, errors} = await client.hello('world', {
    loading: true // Above listener would be called
})}); 
```

#### ```Constants.LOADING_END```
Same as `LOADING_START`, listener would be called when an action has finished loading.

```js
client.events.on(Constants.LOADING_END, ([action, payload]) => console.log(`Finished action ${action} with payload`, payload));
````

#### ```Constants.ACTION_SUCCESS```
Event is called when an action has run successfully and server hasn't returned any error.

```js
client.events.on(Constants.ACTION_SUCCESS, ([action, result, payload]) => console.log(`Finished action ${action} with payload`, payload, 'result', result));
````

#### ```Constants.ACTION_ERROR```
The error event is called whenever an action fails to run.

```js
client.events.on(Constants.ACTION_ERROR, ([action, errors, payload]) => console.log(`Action ${action} failed with payload`, payload, 'errors', errors));
````

#### ```Constants.ACTION_PROGRESS```
Progress event is useful for file uploads. Note that progress must be passed for it to be triggered. The progress value is a number between 0 and 100.

```js
client.events.on(Constants.ACTION_PROGRESS, ([action, progress]) => console.log(`Action ${action} is ${progress} done.`));
const {data, errors} = await client.hello('world', {
    progress: true
});
```

#### ```Constants.SOCKET_CONNECTED```
Used by the underlying socket client if websocket is enabled.

#### ```Constants.SOCKET_DISCONNECTED```
Called when the library web socket server is disconnected.

#### ```Constants.SOCKET_RECONNECTED```
The reconnect event is called when the client underlying web socket client reconnects.

#### ```Constants.SOCKET_AUTHENTICATED```
Event is called after the web socket was authenticated. More on authentication can be read in the [authentication](/client/auth) documentation.
