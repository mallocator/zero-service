'use strict';

var Events = require('eventemitter2');
var expect = require('chai').expect;

var unicast = require('../../src/discovery/unicast');


describe('discovery.unicast', () => {
  it('should emit the discovered event', done => {
    var emitter = new Events();

    emitter.on('discovered', nodes => {
      expect(nodes.length).to.equal(2);
      expect(nodes[0]).to.deep.equal('tcp//:1.0.0.0:1');
      expect(nodes[1]).to.deep.equal('tcp//:1.0.0.0:2');
      done();
    });

    unicast.discover({
      discovery: {
        hosts: ['tcp//:1.0.0.0:1', 'tcp//:1.0.0.0:2']
      }
    }, emitter);
  });
});
