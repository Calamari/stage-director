
var Interaction = require('../src/interaction');
var expect = require('expect.js');

describe('Interaction', function() {
  var interaction;
  it('has a type', function() {
    interaction = new Interaction('CreateCoolStuff');
    expect(interaction.type).to.eql('CreateCoolStuff');
  });

  describe('execution', function() {
    var called, args;
    beforeEach(function() {
      called = false;
      args = false;
      interaction = new Interaction('CreateCoolStuff', {
        execute: function(data) {
          called = true;
          args = data;
        }
      });
    });

    it('calling it will call execute', function() {
      interaction();
      expect(called).to.eql(true);
    });

    it('calling it will pass through the input if not specified otherwise', function() {
      interaction({ foo: 'bar' });
      expect(args).to.eql({ foo: 'bar' });
    });

    it('returns a promise', function() {
      var result = interaction();
      expect(typeof result.then).to.eql('function');
    });

    describe('Calling cb without err', function() {
      beforeEach(function() {
        interaction = new Interaction('CreateCoolStuff', {
          execute: function(data, cb) {
            cb(null, 42);
          }
        });
      });

      it('it is a successful promise and will call the success then function', function(done) {
        interaction().then(function(arg) {
          expect(arg).to.eql(42);
          done();
        }, function() {
          expect().fail('Should not be called.');
          done();
        });
      });
    });

    describe('Calling cb with an err', function() {
      beforeEach(function() {
        interaction = new Interaction('CreateCoolStuff', {
          execute: function(data, cb) {
            cb('Bad things happen');
          }
        });
      });

      it('it is a errornous promise and will call the fail then function', function(done) {
        interaction().then(function(arg) {
          expect().fail('Should not be called.');
          done();
        }, function(err) {
          expect(err).to.eql('Bad things happen');
          done();
        });
      });
    });
  });

  describe('validation', function() {
    describe('custom made', function() {
      var called, args;
      beforeEach(function() {
        interaction = new Interaction('CustomValidation', {
          validation: function(data) {
            args = data;
          },
          execute: function(data, cb) {
            cb(null, 'success');
          }
        });
      });

      it('validation method receives the given data', function() {
        interaction({ my: 'data' });
        expect(args).to.eql({ my: 'data' });
      });

      it('execute is still called when validation did not add errors', function(done) {
        interaction().then(function(success) {
          expect(success).to.eql('success');
          done();
        });
      });

      describe('an errornous validation', function() {
        var executeCalled;
        beforeEach(function() {
          executeCalled = false;
          interaction = new Interaction('CustomValidation', {
            validation: function(data) {
              if (data.input !== 42) {
                this.error('Invalid', 'input', 'Bad, bad, bad!');
              }
              if (data.input === 23) {
                this.error(Interaction.INVALID, 'input', 'Really bad.');
              }
              if (data.field === 23) {
                this.error(Interaction.INVALID, 'field', 'Not your thing, right?');
              }
            },
            execute: function(data, cb) {
              executeCalled = true;
              cb(null, 'success');
            }
          });
        });

        it('does not call execute', function() {
          interaction({ input: 32 });
          expect(executeCalled).to.eql(false);
        });

        it('returns a ValidationError instead', function(done) {
          interaction({ input: 32 }).fail(function(err) {
            expect(err).to.be.a(Interaction.ValidationError);
            expect(err.type).to.eql('ValidationError');
            expect(err.validationError).to.be(true);

            done();
          });
        });

        it('can access the given errors', function(done) {
          interaction({ input: 32 }).fail(function(err) {
            expect(Object.keys(err.errors)).to.have.length(1);
            expect(err.errors.input).to.have.length(1);
            expect(err.errors.input[0].type).to.eql('Invalid');
            expect(err.errors.input[0].message).to.eql('Bad, bad, bad!');

            done();
          });
        });

        it('can handle multiple errors', function(done) {
          interaction({ input: 23, field: 23 }).fail(function(err) {
            expect(Object.keys(err.errors)).to.have.length(2);
            expect(err.errors.input).to.have.length(2);
            expect(err.errors.input[0].type).to.eql(Interaction.INVALID);
            expect(err.errors.input[0].message).to.eql('Bad, bad, bad!');
            expect(err.errors.input[1].type).to.eql(Interaction.INVALID);
            expect(err.errors.input[1].message).to.eql('Really bad.');

            expect(err.errors.field[0].type).to.eql(Interaction.INVALID);
            expect(err.errors.field[0].message).to.eql('Not your thing, right?');

            done();
          });
        });
      });
    });
  });
});
