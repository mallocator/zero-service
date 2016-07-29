'use strict';

/**
 * A node holds all information about one instance of ZeroService with all the services that are registered to that
 * instance.
 */
class Node {
  /**
   * @property {string} id                A unique id to identify this node
   * @property {string} host              A host address that is usable by zeromq
   * @property {Service[]} [services=[]]  A list of services that are available on this node
   */
  constructor(id, host, services = {}) {
    this._id = id;
    this._host = host;
    this._services = services;
  }

  /**
   *
   * @returns {string}
   */
  get id() {
    return this._id;
  }

  /**
   *
   * @returns {string}
   */
  get host() {
    return this._host;
  }

  /**
   * @returns {Service[]}
   */
  get services() {
    return this._services;
  }

  /**
   * @param {string} type
   * @returns {Service}
   */
  getService(type, port) {
    for (let i in this._services) {
      if (this._services[i].type == type) {
        if (!port || this._services[i].port == port) {
          return this._services[i];
        }
      }
    }
    return null;
  }
}

module.exports = Node;
