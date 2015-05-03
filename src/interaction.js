
var Q = require('q');

var ValidationError = function ValidationError(errors) {
  this.type = 'ValidationError';
  this.validationError = true;
  this.errors = errors;
};

module.exports = function(name, definition) {
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


module.exports.ValidationError = ValidationError;
module.exports.INVALID = 'Invalid';


