# Validator

The validator is an underlying component of the client library that is being run on each action call based on action's input signature.

It can be called on demand using `client.validator` instance.

Following is an example when validator is called on demand:

```js
const values = {
    a: 21,
    b: 'AA'
};

const result = await client.validator.validate(values, {
    a: 'required|number',
    b: 'required|string|min:1'
}); // true if passed | object containing errors if failed
```

#### Client & Server auto validation

Following is an example with rules that are validated on both client and server while input structure is defined only on server through action builder.

```js 
// server
const {config} = require('@dreesq/serpent');

config({
    name: 'testAction',
    input: {
        test: 'required|string|min:1'
    }
})('response')

// client
const {data, errors} = await client.testAction({});
```

As input structure of the action is returned on `list` route, we can automatically validate on both client and server components. Note that on client, only non-server rules are being run.

You may disable auto-validation behaviour in client component by passing `validate: false` inside the action call config object as following:

```js
const {data, errors} = await client.testAction({}, {
    validate: false
});
```

### Rules

Library ships with the following validations:

1. `email` - Validates if input exists, to be a valid email
2. `required` - Validates for value to exist
3. `string` - Validates if input exists, to be a valid string
4. `min:1` - If string, checks to have at least 1 in length, if number, checks to have minimum 1 as value
4. `max:1` - If string, checks to have maximum 1 in length, if number, checks to have maximum 1 as value
6. `number` - Validates if input exists, to be a valid number
7. `sameAs:field` - Validates for an input item to have same value as another `field`
8. `date` - Validates if input exists, to be a valid date
10. `when:field,23` - Validates whole rule if `field` has value 23

*Note:* These rules are also available in the server plugin, validator facilitating client / server validation.
