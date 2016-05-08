'use strict';

var Listener = require('./listener');


class Pull extends Listener {
  /**
   * @param emitter     The global emitter
   * @param service     The service to subscribe to
   * @param knownNodes  All the nodes this node known about
   */
  constructor(emitter, service, knownNodes) {
    super('pull', emitter, service, knownNodes);
  }
}

module.exports = Pull;
