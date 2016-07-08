'use strict';

var expect = require('chai').expect;

var Zero = require('../');


describe('zero-services', () => {
  it('should be able to create an instance', () => {
    new Zero();
  });

  it('should be able to create a local push/pull connection', done => {
    var zero = new Zero();
    var push = zero.push('test');
    var pull = zero.pull('test');

    pull.on('message', msg => {
      expect(msg).to.equal('Test Message');
      done();
    });

    push.send('Test Message');
  });

  it('should be able to create a local pub/sub connection', done => {
    var zero = new Zero();
    var pub = zero.pub('test');
    var sub = zero.sub('test');
    sub.subscribe('Test');

    sub.on('message', msg => {
      expect(msg).to.equal('Test Message');
      done();
    });

    pub.send('Test Message');
  });

  it('should be able to create a local req/rep connection', done => {
    var zero = new Zero();
    var req = zero.req('test');
    var rep = zero.rep('test');

    req.on('message', msg => {
      expect(msg).to.equal('Test Response');
      done();
    });

    rep.on('message', msg => {
      expect(msg).to.equal('Test Message');
      rep.send('Test Response');
    });

    req.send('Test Message');
  });
});
