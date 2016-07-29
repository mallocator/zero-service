'use strict';

var Listener = require('./listener');
var Sender = require('./sender');
var Receiver = require('./receiver');
var Broadcaster = require('./broadcaster');

class Cluster {
  /**
   *
   * @param {Options} options
   * @param {EventEmitter} emitter
   * @param {Node} selfNode
   */
  constructor(options, emitter, selfNode) {
    this.options = options;
    this.emitter = emitter;
    this.listener = new Listener(options, emitter);
    this.sender = new Sender(options, emitter);
    this.receiver = new Receiver(options, emitter);
    this.broadcaster = new Broadcaster(options, emitter);
    this.nodes = {
      [this.options.id] : selfNode
    };
    this.services = {};
    this.emitter.on('nodeAdded', this._onNodeAdded.bind(this));
    this.emitter.on('nodeRemoved', this._onNodeRemoved.bind(this));
    this.emitter.on('serviceAdded', this._onServiceAdded.bind(this));
    this.emitter.on('serviceRemoved', this._onServiceRemoved.bind(this));
  }

  connect() {
    this.listener.start();
  }

  /**
   *
   * @param {Service} service
   */
  addService(service) {
    this.emitter.emit('serviceAdded', service);
  }

  /**
   * Removes a service from this node and notifies the cluster.
   * @param {string} id
   */
  removeService(id) {
    this.emitter.emit('serviceRemoved', this.nodes[this.options.id].services[id]);
  }

  /**
   * @param {Node} node
   * @private
   */
  _onNodeAdded(node) {
    this.nodes[node.id] = node;
  }

  /**
   * @param {Node} node
   * @private
   */
  _onNodeRemoved(node) {
    delete this.nodes[node.id];
  }

  /**
   * @param {Service} service
   * @private
   */
  _onServiceAdded(service) {
    this.nodes[service.node].services[service.id] = service;
  }

  /**
   * @param {Service} service
   * @private
   */
  _onServiceRemoved(service) {
    delete this.nodes[service.node].services[service.id];
  }
}

module.exports = Cluster;
