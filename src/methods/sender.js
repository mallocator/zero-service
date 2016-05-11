'use strict';

var events = require('eventemitter2');
var zmq = require('zmq');

/**
 * @abstract
 */
class Sender extends events {
  /**
   *
   * @param type    The type of local socket to bind to
   * @param address
     */
  constructor(type, address) {
    super();
    this.socket = zmq.socket(type);
    this.socket.bind(address, err => {
      if (err) {
        return this.emit('error', new Error(err));
      }
      this.emit('bound');
    });
  }

  send(msg, flags, cb) {
    this.socket.send(msg, flags, cb);
  }
}

module.exports = Sender;
