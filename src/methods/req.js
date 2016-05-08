'use strict';

var Listener = require('./listener');


class Req extends Listener {
  /**
   * @param emitter     The global emitter
   * @param service     The service to subscribe to
   * @param knownNodes  All the nodes this node known about
   */
  constructor(emitter, service, knownNodes) {
    super('req', emitter, service, knownNodes);
  }
}

module.exports = Req;
