'use strict';

class Store {
  constructor(options) {
    this.nodes = {};
  }

  addNode(node) {
    this.nodes[node.id] = {};
  }

  removeNode(node) {
    delete this.nodes[node.id];
  }

  addService(node, service) {
    // TODO store something useful, such as ping time
    this.nodes[node.id][service.id] = {};
  }

  removeService(node, service) {
    delete this.nodes[node.id][service.id];
  }
}

module.exports = new Store();
