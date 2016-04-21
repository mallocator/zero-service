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
 * The interval reference used to turn off sending messages once we have discovered another node.
 * @type {null}
 */
exports.interval = null;

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
  exports.start(options);
};

/**
 * @param {Options} [options] Optional options object that allows to override the cached version.
 */
exports.start = function(options) {
  options = options || exports.options;
  var socket = exports.socket = dgram.createSocket("udp4");

  socket.on('listening', () => {
    options.debug('Listening for other nodes using multicast on port', options.discovery.port);
  });
  socket.on('message', msg => {
    msg = msg.toString('utf8');
    if (msg != options.listen) {
      exports.emitter.emit('discovered', msg);
    }
  });
  socket.bind(options.discovery.port, options.discovery.address, () => {
    socket.setBroadcast(true);
    exports.interval = setInterval(() => {
      var message = new Buffer(options.listen, 'utf8');
      var port = options.discovery.sendPort || options.discovery.port;
      socket.send(message, 0, message.length, port, options.discovery.broadcast, err => {
        if (err) {
          throw new Error(err);
        }
      });
    }, options.discovery.interval);
  });
};

/**
 * Stops the broadcast listener and sender as well close the udp socket.
 */
exports.stop = function() {
  exports.interval && clearInterval(exports.interval);
  if (exports.emitter) {
    exports.emitter.removeListener('connected', exports.stop);
    exports.emitter.removeListener('disconnected', exports.start);
  }
  if (exports.socket) {
    exports.socket.close();
    delete exports.socket;
  }
};
