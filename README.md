<p align="center"> 
  <img src="docs/res/logo.png" style="width: 191px;margin-bottom:23px;">
  <br />
  <a href="https://dreesq.github.io/serpent">Documentation</a>
</p>

Serpent is the core component of Dreesq's ecosystem. Its purpose is to better improve developer's productivity by dealing with most of the code boilerplate any new application would require such as: Authentication, Middlewares, WebSockets, Internationalization etc.

The framework is built with extension in mind, each aspect of it being configurable and extendable.

The main focus is to provide high quality, high performance code, while still keeping Node's beautiful parts without introducing new paradigms. Because of that, no preprocessor is used.
 
We think that web applications should be fun to develop.

### Setup

`npm install express @dreesq/serpent --save`

Here's a basic http server example

```js
const {setup, get, start} = require('@dreesq/serpent');
const app = require('express')();

get('/hello/:name', async ({ input }) => `Hello there ${input.name}!`);
setup(app).then(start);
```
