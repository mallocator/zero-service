'use strict';

var events = require('eventemitter2');
var zmq = require('zmq');


class Rep extends events {
  constructor(address) {
    super();
    this.socket = zmq.socket('rep');
    this.socket.bind(address, err => {
      if (err) {
        return this.emit('error', new Error(err));
      }
      this.socket.on('message', msg => {
        this.emit('message', msg, this.socket);
      });
      this.emit('bound');
    });
  }
}

module.exports = Rep;
