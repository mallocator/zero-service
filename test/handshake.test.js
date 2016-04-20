'use strict';

var Events = require('eventemitter2');
var expect = require('chai').expect;

var Listener = require('../src/cluster/listener');
var Sender = require('../src/cluster/sender');


describe('handshake', () => {
  it('should perform a successful handshake with another unconnected node', done => {
    var listenerEmitter = new Events();
    listenerEmitter.on('error', expect.fail);
    var listener = new Listener({
      id: 'listener',
      debug: function() {},
      handshake: 'tcp://127.0.0.1:11111',
      listen: 'tcp://127.0.0.1:11112'
    }, listenerEmitter);
    listener.start();

    var senderEmitter = new Events();
    senderEmitter.on('error', expect.fail);
    new Sender({
      id: 'sender',
      debug: function() {},
      handshake: 'tcp://127.0.0.1:22222',
      listen: 'tcp://127.0.0.1:22223'
    }, senderEmitter);

    var events = 0;
    listenerEmitter.on('nodeAdded', node => {
      expect(node).to.deep.equal({
          id: 'sender',
          host: 'tcp://127.0.0.1:22223',
          services: {}
      });
      events++;
      events == 2 && done();
    });

    senderEmitter.on('clusterFound', nodes => {
      expect(nodes).to.deep.equal({
        listener: {
          host: 'tcp://127.0.0.1:11112',
          id: 'listener',
          services: {}
        }
      });
      events++;
      events == 2 && done();
    });

    senderEmitter.emit('discovered', [
      {host: 'tcp://127.0.0.1:11111'}
    ]);
  });

  it('should perform a successful handshake with a node that is already part of a cluster');
});
