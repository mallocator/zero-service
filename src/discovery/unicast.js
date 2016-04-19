'use strict';

var zmq = require('zmq');


/**
 * This method really doesn't do much other than return the list it was given.
 * @param options
 * @param emitter
 */
exports.discover = function(options, emitter) {
  var nodes = [];
  for (let host of options.discovery.hosts) {
    nodes.push({ host });
  }
  emitter.emit('discovered', nodes);
};
