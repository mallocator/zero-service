'use strict';

/**
 * A storage class that keeps the current known state of the cluster in memory.
 */
class Store {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.nodes = {};

    emitter.on('nodeAdded', this.addNode);
    emitter.on('nodeRemoved', this.removeNode);
    emitter.on('serviceAdded', this.addService);
    emitter.on('serviceRemoved', this.removeService);
  }

  /**
   * Stores a nodes information.
   * @param {object} node
   * @listens nodeAdded
   */
  addNode(node) {
    this.nodes[node.host] = node;
    this.nodes[node.host].services = {};
  }

  /**
   * Removes a node.
   * @param {object} node
   * @listens nodeRemoved
   */
  removeNode(node) {
    delete this.nodes[node.host];
  }

  /**
   * Adds a service that is part of a known node.
   * @param {object} service
   * @listens serviceAdded
   */
  addService(service) {
    this.nodes[service.node].services[service.id] = service;
  }

  /**
   * Removes a service from a known node.
   * @param service
   * @listens serviceRemoved
   */
  removeService(service) {
    delete this.nodes[service.node].services[service.id];
  }
}

module.exports = Store;
