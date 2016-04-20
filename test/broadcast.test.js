'use strict';

var Events = require('eventemitter2');
var expect = require('chai').expect;

var Broadcaster = require('../src/cluster/broadcaster');
var Receiver = require('../src/cluster/receiver');


describe('broadcast', () => {
  describe('nodes', () => {
    it('should send a message to the only other connected node', done => {
      var bcEmitter = new Events();
      var bc = new Broadcaster({
        id: 'broadcaster',
        debug: () => {},
        listen: 'tcp://127.0.0.1:11111'
      }, bcEmitter);
      bcEmitter.on('error', err => { throw err; });
      bc.start();

      var rcEmitter = new Events();
      rcEmitter.on('error', err => { throw err; });
      new Receiver({
        id: 'receiver',
        debug: () => {}
      }, rcEmitter);

      rcEmitter.emit('nodeAdded', {
        id: 'broadcaster',
        host: 'tcp://127.0.0.1:11111',
        services: {}
      });

      rcEmitter.on('serviceAdded', arg => {
        expect(arg).to.equal('test');
        rcEmitter.emit('nodeRemoved', {
          id: bc.options.id,
          host: bc.options.listen
        });
        bcEmitter.on('ignoring', done);
        bc.stop();
      });

      setTimeout(() => {
        bc.send('serviceAdded', 'test');
      }, 10);
    });

    it('should receive messages from multiple broadcasters', done => {
      var rcEmitter = new Events();
      rcEmitter.on('error', err => { throw err; });
      new Receiver({
        id: 'receiver',
        debug: () => {}
      }, rcEmitter);

      var sources = 2;
      var bcs = [];
      for (let i = 0; i < sources; i++) {
        let bcEmitter = new Events();
        let bc = new Broadcaster({
          id: 'broadcaster' + i,
          debug: () => {},
          listen: 'tcp://127.0.0.1:1111' + i
        }, bcEmitter);
        bcEmitter.on('error', err => { throw err; });
        bc.start();

        bcEmitter.on('ignoring', () => {
          rcEmitter.emit('nodeRemoved', {
            id: bc.options.id,
            host: bc.options.listen
          });
        });

        rcEmitter.emit('nodeAdded', {
          id: 'broadcaster' + i,
          host: 'tcp://127.0.0.1:1111' + i,
          services: {}
        });
        bcs.push(bc);
      }

      let events = 0;
      rcEmitter.on('serviceAdded', arg => {
        expect(arg).to.equal('test');
        events++;
        if (events >= sources) {
          for (let bc of bcs) {
            bc.stop();
          }
          done();
        }
      });

      for (let bc of bcs) {
        setTimeout(() => {
          bc.send('serviceAdded', 'test');
        }, 10);
      }
    });

    it('should send a message to all connected nodes', done => {
      var bcEmitter = new Events();
      bcEmitter.on('error', err => { throw err; });
      var bc = new Broadcaster({
        id: 'broadcaster',
        debug: console.log,
        listen: 'tcp://127.0.0.1:11111'
      }, bcEmitter);
      bc.start();

      var receivers = 2;
      var events = 0;
      for (let i = 0; i < receivers; i++) {
        let rcEmitter = new Events();
        rcEmitter.on('error', err => { throw err; });
        new Receiver({
          id: 'receiver' + i,
          debug: console.log
        }, rcEmitter);

        rcEmitter.emit('nodeAdded', {
          id: 'broadcaster',
          host: 'tcp://127.0.0.1:11111',
          services: {}
        });

        rcEmitter.on('serviceAdded', arg => {
          expect(arg).to.equal('test');
          rcEmitter.emit('nodeRemoved', {
            id: bc.options.id,
            host: bc.options.listen
          });
          events++;
          if (events >= receivers) {
            bcEmitter.on('ignoring', done);
            bc.stop();
          }
        });
      }

      setTimeout(() => {
        bc.send('serviceAdded', 'test');
      }, 10);
    });
  });
});
