'use strict';

var Sender = require('./sender');


class Rep extends Sender {
  /**
   * @param {EventEmitter} emitter
   * @param {Service} service
   */
  constructor(emitter, service) {
    super('rep', emitter, service, []);
    this.once('bound', () => {
      this.socket.on('message', msg => {
        this.emit('message', msg, this);
      });
    });
  }

  send(msg, flags, cb) {
    this.socket.send(msg, flags, cb);
  }
}

module.exports = Rep;
