'use strict';

var Events = require('eventemitter2');
var expect = require('chai').expect;

var Broadcaster = require('../src/cluster/broadcaster');
var Receiver = require('../src/cluster/receiver');


describe('broadcast', () => {
  describe('nodes', () => {
    it('should send a message to the only other connected node', done => {
      let bcEmitter = new Events();
      let bc = new Broadcaster({
        id: 'broadcaster',
        debug: () => {},
        listen: 'tcp://127.0.0.1:11111'
      }, bcEmitter);
      bcEmitter.on('error', err => { throw err; });
      bc.start();

      let rcEmitter = new Events();
      rcEmitter.on('error', err => { throw err; });
      new Receiver({
        id: 'receiver',
        debug: () => {},
        nodes: {
          maxPeers: Number.POSITIVE_INFINITY
        }
      }, rcEmitter);

      rcEmitter.emit('nodeAdded', {
        id: 'broadcaster',
        host: 'tcp://127.0.0.1:11111',
        services: {}
      });

      rcEmitter.on('serviceAdded', arg => {
        expect(arg).to.deep.equal({
          node: 'broadcaster',
          id: 'test'
        });
        rcEmitter.emit('nodeRemoved', {
          id: bc.options.id,
          host: bc.options.listen
        });
        bcEmitter.on('ignoring', done);
        bc.stop();
      });

      setTimeout(() => {
        bcEmitter.emit('serviceAdded', {
          node: 'broadcaster',
          id: 'test'
        });
      }, 10);
    });

    it('should receive messages from multiple broadcasters', done => {
      let rcEmitter = new Events();
      rcEmitter.on('error', err => { throw err; });
      new Receiver({
        id: 'receiver',
        debug: () => {},
        nodes: {
          maxPeers: Number.POSITIVE_INFINITY
        }
      }, rcEmitter);

      let sources = 2;
      let bcs = [];
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
      let bcEmitter = new Events();
      bcEmitter.on('error', err => { throw err; });
      let bc = new Broadcaster({
        id: 'broadcaster',
        debug: () => {},
        listen: 'tcp://127.0.0.1:11111'
      }, bcEmitter);
      bc.start();

      let receivers = 2;
      let events = 0;
      for (let i = 0; i < receivers; i++) {
        let rcEmitter = new Events();
        rcEmitter.on('error', err => { throw err; });
        new Receiver({
          id: 'receiver' + i,
          debug: () => {},
          nodes: {
            maxPeers: Number.POSITIVE_INFINITY
          }
        }, rcEmitter);

        rcEmitter.emit('nodeAdded', {
          id: 'broadcaster',
          host: 'tcp://127.0.0.1:11111',
          services: {}
        });

        rcEmitter.on('serviceAdded', arg => {
          expect(arg).to.deep.equal({
            node: 'broadcaster'
          });
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
        bcEmitter.emit('serviceAdded', {
          node: 'broadcaster'
        });
      }, 10);
    });
  });
});
