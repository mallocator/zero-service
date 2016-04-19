'use strict';

var zmq = require('zmq');


class Broadcaster {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.socket = zmq.socket('pub');
    this.socket.bind(options.listen, err => {
      if (err) {
        return this.emitter.emit('error', err instanceof Error ? err : new Error(err));
      }
      this.options.debug('Broadcaster is listening as', options.listen);
      this.emitter.emit('listening')
    });
  }

  send(topic, msg) {
    this.socket.send(topic, msg);
  }
}

module.exports = Broadcaster;
