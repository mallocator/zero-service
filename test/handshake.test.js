'use strict';

var Events = require('eventemitter2');
var expect = require('chai').expect;

var Listener = require('../src/cluster/listener');
var Sender = require('../src/cluster/sender');


describe('handshake', () => {
  it('should perform a successful handshake with an exchange of available nodes', done => {
    var listenerEmitter = new Events();
    listenerEmitter.on('error', expect.fail);
    var listener = new Listener({
      debug: function() {},
      handshake: 'tcp://127.0.0.1:11111',
      listen: 'tcp://127.0.0.1:11112'
    }, listenerEmitter);
    listener.start();

    var senderEmitter = new Events();
    senderEmitter.on('error', expect.fail);
    new Sender({
      debug: function() {},
      handshake: 'tcp://127.0.0.1:22222',
      listen: 'tcp://127.0.0.1:22223'
    }, senderEmitter);

    var events = 0;
    listenerEmitter.on('nodeAdded', node => {
      expect(node).to.deep.equal({host: 'tcp://127.0.0.1:22223'});
      events++;
      events == 2 && done();
    });

    senderEmitter.on('clusterFound', nodes => {
      expect(nodes).to.deep.equal([{host: 'tcp://127.0.0.1:11112'}]);
      events++;
      events == 2 && done();
    });

    senderEmitter.emit('discovered', [
      {host: 'tcp://127.0.0.1:11111'}
    ]);
  });
});
