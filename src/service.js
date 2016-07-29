'use strict';

/**
 * Holds the information for a service that is made available on a node. A service always needs to have an existing
 * node.
 */
class Service {
  /**
   *
   * @param {string} id    A unique id to identify this service
   * @param {Node} node  The node id to which this service belongs
   * @param {number} port  The port on which we can connect to this service on other nodes
   */
  constructor(id, node, port) {
    this._id = id;
    this._node = node;
    this._port = port;
  }

  /**
   * @returns {string}
   */
  get id() {
    return this._id;
  }

  /**
   * @returns {Node}
   */
  get node() {
    return this._node;
  }

  /**
   * @returns {string}
   */
  get host() {
    return this.node.host;
  }

  /**
   * @returns {number}
   */
  get port() {
    return this._port;
  }
}

module.exports = Service;
