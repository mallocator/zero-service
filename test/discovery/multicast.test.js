'use strict';

var events = require('events');

var expect = require('chai').expect;

var multicast = require('../../src/discovery/multicast');


describe('multicast', () => {
    it('should start a multicast server and send out ping until it can connect', done => {
        let emitter = new events.EventEmitter();
        var count = 0;
        emitter.on('discovered', msg => {
            expect(msg).to.be.oneOf(['tcp://127.0.0.1:2206', 'tcp://127.0.0.1:2207']);
            count++;
            if (count == 2) {
                emitter.emit('connected');
                done();
            }
        });

        let options1 = {
            debug: () => {},
            listen: 'tcp://127.0.0.1:2206',
            discovery: {
                interval: 10,
                port: 21282,
                sendPort: 21283,
                address: '0.0.0.0',
                broadcast: '255.255.255.255'
            }
        };

        multicast.discover(options1, emitter);

        let options2 = {
            debug: () => {},
            listen: 'tcp://127.0.0.1:2207',
            discovery: {
                interval: 900,
                port: 21283,
                sendPort: 21282,
                address: '0.0.0.0',
                broadcast: '255.255.255.255'
            }
        };

        multicast.discover(options2, emitter);
    });
});