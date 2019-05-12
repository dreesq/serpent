<img src="_res/logo.png" style="display:block;margin: 30px auto;"/>

Serpent is the first open source contribution of the dreesq team. Its purpose is to better improve developer's **productivity** by dealing with most of the code boilerplate any new application would require such as: Authentication, Middlewares, WebSockets, Internationalization etc.

The framework is built with extension in mind, thus, we decided to build it on top of an already well known package, express.

Our focus is to provide **high quality**, **high performance** code, while still keeping Node's beautiful parts without introducing new paradigms. Because of that, we decided not to use any preprocessor and use the good old ES6.
 
We think that web applications should be **fun** to develop. Here's a quick snippet on how a basic action would be like:

```js
    const {get} = require('@dreesq/serpent');

    get('/hello/:name', async ({ input }) => `Hello there ${input.name}!`);

```

If we caught your attention, we invite you to the next pages where you will learn how to develop applications using Serpent.