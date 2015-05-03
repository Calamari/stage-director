# StageDirector

JavaScript/NPM module to easily create commands/interactions to specify a clear and easy understandable interface to your app. Complete with input validations.

## (Simplified) Example

Imagine (or just look at) the following interaction:

```javascript
var Interaction = require('stage-director');
var md5 = require('md5');

var createAccount = new Interaction('CreateAccount', {
  inputs: {
    username: {
      type: 'string',
      required: true,
      match: /[0-9a-zA-Z]{6,}/
    },
    password: {
      type: 'string',
      required: true
    }
  },
  execute: function(userData, cb) {
    User.create({
      username: userData.username,
      password: md5(userData.password)
    }, cb);
  }
});
```

This would validate the inputs needed to create a valid User Account and if the input is valid, call the User model to create a new account. If that is done, the interactions promise is being resolved or rejected, depending if user creation could be done.

So you can use this in a controller, a console, or somewhere else:

```javascript
createAccount(request.params).then(function() {
  response.send(200, 'Your account has been created').
}, function(err) {
  if (err.validationError) {
    response.send(400, 'You have some errors in your request.');
  } else {
    response.send(500, 'Something unexpected happend');
  }
});
```

## How to use

Best see the tests to get all the details, how to use it. But here is a short write down:

### Defining an interaction

The Interaction has to be created using a `name` and at least an `execute` method, which will be called with the given params of the command call and a callback, that should be called when the command has finished what it is suppose to do:

```javascript
var Interaction = require('stage-director');
var myCommand = new Interaction('DoStuff', {
  execute: function(data, cb) {
    // do stuff here…
    cb(null);
  }
});
```

Further it accepts a custom validation, that is called for every call of the command, before execute is called. The validation can also query databases and stuff, and has to call done when it is finished, to allow such asynchronous behaviors. If it adds an error, the call of execute will be prohibited:

```javascript
var Interaction = require('stage-director');
var myCommand = new Interaction('DoStuff', {
  validation: function(data, done) {
    if (data.foo === 'bar') {
      this.errors(Interaction.INVALID, 'foo', 'Do not use bar for foo.')
    }
    done();
  },
  execute: function(data, cb) {
    // do stuff here…
    cb(null);
  }
});
```

Lastly you can specify which inputs your interaction will accept, and how to validate it. This is done using [validate](https://github.com/eivindfjeldstad/validate) but the errors provided in the recjection error are a bit further optimised. Using validate means, you can put everything within the `inputs` definition what you would put into the schema of validate:

```javascript
var Interaction = require('stage-director');
var myCommand = new Interaction('DoStuff', {
  inputs: {
    foo: {
      type: 'string',
      required: true
    }
  },
  execute: function(data, cb) {
    // do stuff here…
    cb(null);
  }
});
```

### Use the command

Given any of the definitions above, you could do now the following:

```javascript
myCommand({ foo: 'bar' }).then(function() {
  console.log("I'm probably not called, because foo shouldn't be bar.");
}, function(err) {
  console.log("Foo is not correct, see there errors:", err.errors);
});

myCommand({ foo: '42' })
.then(function() {
  console.log("The stuff the command has done, is done by now.");
})
.fail(function(err) {
  console.log("This should not happen, else the stuff we had done had returned an error.", err);
});
```

Note that the command returns a promise using [Q](https://github.com/kriskowal/q). If it is a validation error (Error that was created during validation), the property `err.validationError` would be `true` and it would contain `errors`, like in the example.


## License

Copyright 2015 Georg Tavonius and contributors MIT License (enclosed)
