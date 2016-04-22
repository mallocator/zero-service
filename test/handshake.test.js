'use strict';

var Events = require('eventemitter2');
var expect = require('chai').expect;

var Listener = require('../src/cluster/listener');
var Sender = require('../src/cluster/sender');


describe('handshake', () => {
  it('should perform a successful handshake with another unconnected node', done => {
    var listenerEmitter = new Events();
    listenerEmitter.on('error', err => { throw err; });
    var listener = new Listener({
      id: 'listener',
      debug: () => {},
      listen: 'tcp://127.0.0.1:11111',
      cluster: {
        name: 'test'
      }
    }, listenerEmitter);
    listener.start();

    var senderEmitter = new Events();
    senderEmitter.on('error', err => { throw err; });
    new Sender({
      id: 'sender',
      debug: () => {},
      listen: 'tcp://127.0.0.1:22222',
      cluster: {
        name: 'test'
      }
    }, senderEmitter);

    var events = 0;
    listenerEmitter.on('nodeAdded', node => {
      expect(node).to.deep.equal({
        id: 'sender',
        host: 'tcp://127.0.0.1:22222',
        services: {}
      });
      events++;
      if (events == 2) {
        listener.stop();
        done();
      }
    });

    senderEmitter.on('clusterFound', nodes => {
      expect(nodes).to.deep.equal({
        listener: {
          host: 'tcp://127.0.0.1:11111',
          id: 'listener',
          services: {}
        }
      });
      events++;
      if (events == 2) {
        listener.stop();
        done();
      }
    });

    senderEmitter.emit('discovered', [
      {host: 'tcp://127.0.0.1:11111'}
    ]);
  });

  it('should perform a successful handshake with a node that is already part of a cluster', done => {
    var listenerEmitter = new Events();
    listenerEmitter.on('error', err => { throw err; });
    var listener = new Listener({
      id: 'listener',
      debug: () => {},
      listen: 'tcp://127.0.0.1:11111',
      cluster: {
        name: 'test'
      }
    }, listenerEmitter);
    listener.start();
    listenerEmitter.emit('nodeAdded', {
      id: 'knownNode',
      host: 'tcp:127.0.0.1:33333',
      services: {}
    });

    var senderEmitter = new Events();
    senderEmitter.on('error', err => { throw err; });
    new Sender({
      id: 'sender',
      debug: () => {},
      listen: 'tcp://127.0.0.1:22222',
      cluster: {
        name: 'test'
      }
    }, senderEmitter);

    var events = 0;
    listenerEmitter.on('nodeAdded', node => {
      expect(node).to.deep.equal({
        id: 'sender',
        host: 'tcp://127.0.0.1:22222',
        services: {}
      });
      events++;
    });

    senderEmitter.on('clusterFound', nodes => {
      expect(nodes).to.deep.equal({
        knownNode: {
          host: 'tcp:127.0.0.1:33333',
          id: 'knownNode',
          services: {}
        },
        listener: {
          host: 'tcp://127.0.0.1:11111',
          id: 'listener',
          services: {}
        }
      });
      events++;
      if (events == 2) {
        listener.stop();
        done();
      }
    });

    senderEmitter.emit('discovered', [
      {host: 'tcp://127.0.0.1:11111'}
    ]);
  });

  it ('should reject a join request from another node when it belongs to a different cluster', done => {
    var listenerEmitter = new Events();
    listenerEmitter.on('error', err => {
      throw err;
    });
    var listener = new Listener({
      id: 'listener',
      debug: () => {},
      listen: 'tcp://127.0.0.1:11111',
      cluster: {
        name: 'test'
      }
    }, listenerEmitter);
    listener.start();

    var senderEmitter = new Events();
    senderEmitter.on('error', err => {
      throw err;
    });
    new Sender({
      id: 'sender',
      debug: () => {},
      listen: 'tcp://127.0.0.1:22222',
      cluster: {
        name: 'other'
      }
    }, senderEmitter);

    listenerEmitter.on('nodeRejected', node => {
      expect(node).to.deep.equal({
        cluster: 'other',
        id: 'sender',
        host: 'tcp://127.0.0.1:22222',
        services: {}
      });
      listener.stop();
      done();
    });

    senderEmitter.emit('discovered', [
      {host: 'tcp://127.0.0.1:11111'}
    ]);
  });
});
