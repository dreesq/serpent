# Introduction

Actions are what makes Serpent unique and are not mandatory to be used but we recommend its usage. You may compare them to a basic graphql, without the graph part.

The idea between actions is that there would be only GET route, called ```list``` route, and a POST route, called ```handler``` route. This route dealing with all the requests, developer wouldn't be required to respect the REST standard anymore.

Actions may be enabled or disabled from the main configuration object. In case you decide not to use them, be advised to also turn actions auto load off.

```js
    await setup(app, {
        actions: {
            batch: true,
            list: '/list',
            handler: '/handler'
        },
        autoload: {
            actions: true
        }
    });
```

The above example will register 2 routes, the ```/list``` route which will return a list of available actions along with its input structure. And a ```/handler``` route that will receive action requests.

`batch` parameter allows running multiple actions in a single http request by sending requests in the handler route with data structure like:
```
    [
        ['firstAction', {input: "A"}],
        ['firstAction', {input: "B"}],
        ['secondAction']
    ]
```

*Note:* Actions are being run in parallel, each action running its own middleware so for example if all actions run the auth middleware, auth middleware will be run 3 times in the above example.

In next chapter we will explore on how to configure and call an action from the outside world.