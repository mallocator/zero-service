'use strict';

var events = require('eventemitter2');
var zmq = require('zmq');


class Pub extends events {
  constructor(address) {
    super();
    this.socket = zmq.socket('pub');
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

module.exports = Pub;
