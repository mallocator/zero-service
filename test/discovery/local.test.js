'use strict';

var fs = require('fs');
var path = require('path');

var Events = require('eventemitter2');
var expect = require('chai').expect;

var local = require('../../src/discovery/local');


/**
 * File used during test for interprocess communication.
 */
var tmpFile = path.join(__dirname, 'tmp');

describe('discovery.local', () => {
  afterEach(function() {
    fs.unlinkSync(tmpFile);
    local.knowHost = [];
  });

  it('should emit the discovered event', done => {
    var emitter = new Events();
    emitter.on('error', err => {
      throw err;
    });
    emitter.on('discovered', nodes => {
      expect(nodes.length).to.equal(1);
      expect(nodes[0]).to.deep.equal('tcp://127.0.0.1:54321');
      expect(fs.readFileSync(tmpFile, 'utf8')).to.equal('tcp://127.0.0.1:12345\ntcp://127.0.0.1:54321\n');
      emitter.once('connected', done);
      emitter.emit('connected');
    });

    local.discover({
      listen: 'tcp://127.0.0.1:12345',
      discovery: {
        file: tmpFile,
        interval: 10
      }
    }, emitter);

    fs.appendFile(tmpFile, 'tcp://127.0.0.1:54321\n', 'utf8');
  });
});
