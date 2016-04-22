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
  if (!exports.socket) {
    exports.socket = dgram.createSocket("udp4");
    exports.socket.on('message', (msg, remote) => {
      msg = msg.toString('utf8');
      if (msg != exports.options.listen) {
        exports.emitter.emit('discovered', msg);
      }
      var message = new Buffer(exports.options.listen, 'utf8');
      exports.socket.setBroadcast(false);
      exports.socket.send(message, 0, message.length, remote.port, remote.address, err => {
        if (err) {
          throw new Error(err);
        }
      });
    });
    exports.socket.bind(exports.options.discovery.port, exports.options.discovery.address, exports.start);
  } else {
    exports.start();
  }
};

exports.start = function() {
  var message = new Buffer(exports.options.listen, 'utf8');
  var port = exports.options.discovery.sendPort || exports.options.discovery.port;
  exports.interval = setInterval(() => {
    exports.socket.setBroadcast(true);
    exports.socket.send(message, 0, message.length, port, exports.options.discovery.broadcast, err => {
      if (err) {
        throw new Error(err);
      }
    });
  }, exports.options.discovery.interval);
};

/**
 * Stops the broadcast sender, but the listener will still run.
 */
exports.stop = function() {
  clearInterval(exports.interval);
  exports.socket.setBroadcast(false);
  exports.emitter.removeListener('connected', exports.stop);
  exports.emitter.removeListener('disconnected', exports.start);
};
