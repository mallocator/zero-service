'use strict';

var Sender = require('./sender');


class Rep extends Sender {
  /**
   *
   * @param address
   * @param {function} [callback] An optional callback that can be set to react to incoming messages as an alternative
   *                              to listening to message events.
   */
  constructor(address, callback) {
    super('rep', address);
    this.once('bound', () => {
      this.socket.on('message', msg => {
        callback && callback(msg, this);
        this.emit('message', msg, this);
      });
    });
  }
}

module.exports = Rep;
