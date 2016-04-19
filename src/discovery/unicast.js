'use strict';

var zmq = require('zmq');

exports.discover = function(options, emitter) {
  var addresses = options.discovery.adresses;
  for (let address of addresses) {
    
    emitter.emit('discovered');
  }
};
