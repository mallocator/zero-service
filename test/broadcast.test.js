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

      bc.send('serviceAdded', 'test');
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

      bc.send('serviceAdded', 'test');
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
      for (var i = 0; i < sources; i++) {
        var bcEmitter = new Events();
        var bc = new Broadcaster({
          id: 'broadcaster' + i,
          debug: () => {},
          listen: 'tcp://127.0.0.1:1111' + i
        }, bcEmitter);
        bcEmitter.on('error', err => { throw err; });
        bc.start();
        bcs.push(bc);

        rcEmitter.emit('nodeAdded', {
          id: 'broadcaster',
          host: 'tcp://127.0.0.1:11110',
          services: {}
        });
      }

      var events = 0;
      rcEmitter.on('serviceAdded', arg => {
        expect(arg).to.equal('test');

        bcEmitter.on('ignoring', () => {
          events++;
          if (events >= sources) {
            for (let bc of bcs) {
              rcEmitter.emit('nodeRemoved', {
                id: bc.options.id,
                host: bc.options.listen
              });
              bc.stop();
              done();
            }
          }
        });
      });

      for (let bc of bcs) {
        bc.send('serviceAdded', 'test');
      }
    });
  });

  describe('services', () => {
    describe('DB strategy', () => {
      it('should send a new service to all other nodes in the cluster');

      it('should remove a node from all other nodes in the cluster');
    });

    describe('Network strategy', () => {
      it('should ask all other nodes for a specific service');
    });
  });
});
