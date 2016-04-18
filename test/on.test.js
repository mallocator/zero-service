'use strict';

var events = require('events');

var expect = require('chai').expect;

var On = require('../src/on');


describe('On', () => {
  describe('#all()', () => {
    it('should fire an event when all events have been fired while return the last event arguments', done => {
      var emitter = new events.EventEmitter();
      var on = new On(emitter);
      var firstCallback = true;
      on.all(['test1', 'test2'], args => {
        expect(Object.keys(args).length).to.equal(2);
        if (firstCallback) {
          expect(args.test1).to.deep.equal(['arg1']);
          expect(args.test2).to.deep.equal(['arg2']);
          firstCallback = false;
        } else {
          expect(args.test1).to.deep.equal(['arg6']);
          expect(args.test2).to.deep.equal(['arg5']);
          done();
        }
      });
      emitter.emit('test1', 'arg1');
      emitter.emit('test2', 'arg2');
      emitter.emit('test1', 'arg4');
      emitter.emit('test1', 'arg6');
      emitter.emit('test2', 'arg5');
    });

    it('should fire an event when all event have been fired while returning the first event arguments', done => {
      var emitter = new events.EventEmitter();
      var on = new On(emitter);
      on.all(['test1', 'test2'], args => {
        expect(Object.keys(args).length).to.equal(2);
        expect(args.test1).to.deep.equal(['arg1']);
        expect(args.test2).to.deep.equal(['arg2']);
        done();
      }, true);
      emitter.emit('test1', 'arg1');
      emitter.emit('test1', 'arg3');
      emitter.emit('test2', 'arg2');
    });
  });

  describe('#allOnce()', () => {
    it('should only be fired once with the first arguments passed in', done => {
      var emitter = new events.EventEmitter();
      var on = new On(emitter);
      on.allOnce(['test1', 'test2'], args => {
        expect(Object.keys(args).length).to.equal(2);
        expect(args.test1).to.deep.equal(['arg1']);
        expect(args.test2).to.deep.equal(['arg2']);
        done();
      });
      emitter.emit('test1', 'arg1');
      emitter.emit('test2', 'arg2');
      emitter.emit('test1', 'arg3');
      emitter.emit('test2', 'arg4');
    });
  });

  describe('#allCached()', () => {
    it('should fire once all events have been fired and cache previous multiple events for future callback', done => {
      var emitter = new events.EventEmitter();
      var on = new On(emitter);
      var count = 0;
      on.allCached(['test1', 'test2'], args => {
        expect(Object.keys(args).length).to.equal(2);
        switch (count) {
          case 0:
            expect(args.test1).to.deep.equal(['arg1']);
            expect(args.test2).to.deep.equal(['arg2']);
            break;
          case 1:
            expect(args.test1).to.deep.equal(['arg3']);
            expect(args.test2).to.deep.equal(['arg4']);
            done();
            break;
        }
        count++;
      });
      emitter.emit('test1', 'arg1');
      emitter.emit('test1', 'arg3');
      emitter.emit('test2', 'arg2');
      emitter.emit('test2', 'arg4');
    });
  });

  describe('#any()', () => {
    it('should fire if any of the events passed in is triggered', done => {
      var emitter = new events.EventEmitter();
      var on = new On(emitter);
      var counter = 0;
      on.any(['test1', 'test2'], (event, args) => {
        switch (counter) {
          case 0:
            expect(event).to.equal('test1');
            expect(args).to.equal('arg1');
            break;
          case 1:
            expect(event).to.equal('test2');
            expect(args).to.equal('arg2');
            done();
        }
        counter++;
      });
      emitter.emit('test1', 'arg1');
      emitter.emit('test2', 'arg2');
    });
  });

  describe('#anyOnce()', () => {
    it('should fire only once as soon as any of the given events has been triggered', done => {
      var emitter = new events.EventEmitter();
      var on = new On(emitter);
      on.anyOnce(['test1', 'test2'], (event, args) => {
          expect(event).to.equal('test1');
          expect(args).to.equal('arg1');
          done();
      });
      emitter.emit('test1', 'arg1');
      emitter.emit('test2', 'arg2');
    });
  });
});
