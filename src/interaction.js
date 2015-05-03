
var Q = require('q');
var schema = require('validate');

var ValidationError = function ValidationError(errors) {
  this.type = 'ValidationError';
  this.validationError = true;
  this.errors = errors;
};

function definitionSchema(inputs) {
  var key, msg;

  for (key in inputs) {
    msg = inputs[key].message;
    inputs[key].message = key + '||' + (msg || key + ' is invalid.');
  }

  return schema(inputs);
}

function validateInputs(inputs, data, validation) {
  if (!inputs) { return []; }

  var errors = definitionSchema(inputs).validate(data);
  errors.forEach(function(msg) {
    msg = msg.split('||');
    validation.error(Interaction.INVALID, msg[0], msg[1]);
  });
}

var Interaction = function(name, definition) {
  var interaction = function(data) {
    var deferred = Q.defer(),
        validation = {
          errors: []
        };

    validation.error = function(type, field, message) {
      if (!this.errors[field]) {
        this.errors[field] = [];
      }
      this.errors[field].push({ type: type, message: message });
    };

    validateInputs(definition.inputs, data, validation);

    if (definition.validation) {
      definition.validation.call(validation, data);
    }

    if (Object.keys(validation.errors).length === 0) {
      definition.execute(data, function interactionCallback(err, data) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(data);
        }
      });
    } else {
      deferred.reject(new ValidationError(validation.errors));
    }

    return deferred.promise;
  };

  interaction.type = name;

  return interaction;
};

Interaction.ValidationError = ValidationError;
Interaction.INVALID = 'Invalid';

module.exports = Interaction;
