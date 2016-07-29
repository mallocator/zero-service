'use strict';

var Listener = require('./listener');


class Req extends Listener {
  /**
   * @param {EventEmitter} emitter              The global emitter
   * @param {Service} service                   The service to subscribe to
   * @param {object.<string, Node>} knownNodes  All the nodes this node known about
   */
  constructor(emitter, service, knownNodes) {
    super('req', emitter, service, knownNodes);
  }

  send(msg, flags, cb) {
    this.socket.send(msg, flags, cb);
  }
}

module.exports = Req;
