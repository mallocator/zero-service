'use strict';

var events = require('eventemitter2');
var zmq = require('zmq');

/**
 * @abstract
 */
class Sender extends events {
  /**
   *
   * @param {string} type           The type of local socket to bind to
   * @param {EventEmitter} emitter  The global event emitter
   * @param {Service} service       The service to send to
   */
  constructor(type, emitter, service) {
    super();
    this.socket = zmq.socket(type);
    this.socket.bind(service.host, err => {
      this.connected = true;
      if (err) {
        return this.emit('error', new Error(err));
      }
      this.emit('bound');
    });
  }

  send(msg, flags, cb) {
    if (!this.connected) {
      return this.once('bound', () => this.send(msg, flags, cb));
    }
    this.socket.send(msg, flags, cb);
  }
}

module.exports = Sender;
