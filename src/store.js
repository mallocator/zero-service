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

  addNode(node) {
    this.nodes[node.id] = node;
    this.nodes[node.id].services = {};
  }

  removeNode(node) {
    delete this.nodes[node.id];
  }

  addService(service) {
    this.nodes[service.node].services[service.id] = service;
  }

  removeService(service) {
    delete this.nodes[service.node].services[service.id];
  }
}

module.exports = Store;
