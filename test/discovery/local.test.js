'use strict';

var fs = require('fs');

var Events = require('eventemitter2');
var expect = require('chai').expect;

var local = require('../../src/discovery/local');


describe('discovery.local', () => {
  after(() => {
    fs.unlink('/tmp/zero.service');
  });

  it('should emit the discovered event', done => {
    var emitter = new Events();

    emitter.on('discovered', nodes => {
      emitter.emit('connected');
      expect(nodes.length).to.equal(1);
      expect(nodes[0]).to.deep.equal('tcp://127.0.0.1:54321');
      done();
    });

    local.discover({
      listen: 'tcp://127.0.0.1:12345',
      discovery: {
        file: '/tmp/zero.service',
        interval: 10
      }
    }, emitter);

    fs.appendFile('/tmp/zero.service', 'tcp://127.0.0.1:54321\n');
  });
});
