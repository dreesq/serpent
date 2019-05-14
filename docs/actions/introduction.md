# Introduction

Actions are what makes Serpent unique and are not mandatory to be used but we recommend its usage. You may compare them to a basic graphql, without the graph part.

The idea between actions is that there would be only GET route, called ```list``` route, and a POST route, called ```handler``` route. This route dealing with all the requests, developer wouldn't be required to respect the REST standard anymore.

Actions may be enabled or disabled from the main configuration object. In case you decide not to use them, be advised to also turn actions auto load off.

```js
    await setup(app, {
        actions: {
            list: '/list',
            handler: '/handler'
        },
        autoload: {
            actions: true
        }
    });
```

The above example will register 2 routes, the ```/list``` route which will return a list of available actions along with its input structure. And a ```/handler``` route that will receive action requests.

In next chapter we will explore on how to configure and call an action from the outside world.