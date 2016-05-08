'use strict';

var _ = require('lodash');

var Listener = require('./listener');


class Sub extends Listener {
  /**
   * @param emitter     The global emitter
   * @param service     The service to subscribe to
   * @param knownNodes  All the nodes this node known about
   */
  constructor(emitter, service, knownNodes) {
    super('sub', emitter, service, knownNodes);
  }

  /**
   * Add topic(s) that this subscription listener should react on.
   * @param {String|String[]} topic
   */
  subscribe(topic) {
    topic = _.isArray(topic) ? topic : [topic];
    for (let entry of topic) {
      this.socket.subscribe(entry);
    }
  }

  /**
   * Remove topic(s) that this subscription listener should react on.
   * @param {String|String[]} topic
   */
  unsubscribe(topic) {
    topic = _.isArray(topic) ? topic : [topic];
    for (let entry of topic) {
      this.socket.unsubscribe(entry);
    }
  }
}

module.exports = Sub;
