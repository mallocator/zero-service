'use strict';

var events = require('events');

var expect = require('chai').expect;

var aws = require('../../src/discovery/aws');


if (process.env.INTEGRATION) {
  describe('discovery.aws', () => {
    it('should connect to AWS and list all instances', done => {
      var emitter = new events.EventEmitter();
      emitter.on('error', err => {
        throw err;
      });
      emitter.on('discovered', msg => {
        expect(msg).to.deep.equal(['tcp://ec2-hostname:12345']);
        done();
      });
      // Will connect using environment credentials
      aws.discover({
        debug: console.log,
        listen: 'tcp://127.0.0.1:2206',
        discovery: {
          region: 'us-east-1',
          port: 12345,
          filters: [{
            Name: 'instance.group-name',
            Values: ['securityGroup']
          }]
        }
      }, emitter);
    });
  });
}
