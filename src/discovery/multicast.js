'use strict';

var dgram = require('dgram');

/**
 * The global {@link Options} object.
 * @type Options
 */
exports.options = null;

/**
 * The global emitter
 * @type {EventEmitter}
 */
exports.emitter = null;

/**
 * The dgram socket used to broadcast and listen.
 * @type {dgram.Socket}
 */
exports.socket = null;
/**
 * Creates a UPD servce that listens for incoming messages and at the same time broadcasts messages out until we have
 * managed to find a cluster.
 * @param {Options} options
 * @param {EventEmitter} emitter
 */
exports.discover = function(options, emitter) {
  exports.options = options;
  exports.emitter = emitter;
  emitter.on('connected', exports.stop);
  emitter.on('disconnected', exports.start);
  exports.start();
};

exports.start = function() {
  var socket = exports.socket = dgram.createSocket("udp4");
  socket.on('listening', () => {
    exports.options.debug('Listening for other nodes using multicast on port', exports.options.discovery.port);
  });
  socket.on('message', msg => {
    exports.emitter.emit('discovered', msg.toString('utf8'));
  });
  socket.bind(() => {
    socket.setBroadcast(true);
    setInterval(() => {
      var message = new Buffer(exports.options.listen, 'utf8');
      socket.send(message, 0, message.length, exports.options.discovery.port, exports.options.discovery.address);
    }, exports.options.discovery.interval);
  });
};

exports.stop = function() {
  exports.socket.close();
  exports.removeListener('connected', exports.stop);
  exports.removeListener('disconnected', exports.start);
  delete exports.socket;
};
