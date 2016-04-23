'use strict';

/**
 * This method really doesn't do much other than return the list it was given.
 * @param {object} options
 * @param {EventEmitter} emitter
 */
exports.discover = function(options, emitter) {
  emitter.emit('discovered', options.discovery.hosts);
};
