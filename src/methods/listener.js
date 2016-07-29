'use strict';

var events = require('eventemitter2');
var zmq = require('zmq');


/**
 * @abstract
 */
class Listener extends events {
  /**
   * @param {string} type                       The type of remote socket to connect to
   * @param {EventEmitter} emitter              The global emitter
   * @param {Service} service                   The service to subscribe to
   * @param {object.<string, Node>} knownNodes  All the nodes this node known about
   */
  constructor(type, emitter, service, knownNodes) {
    super();
    this.service = service;
    this.knownServices = {};
    this.socket = zmq.socket(type);
    this.socket.on('message', msg => this.emit('message', msg));
    for (let id in knownNodes) {
      var nodeService = knownNodes[id].services[service.id];
      if (nodeService) {
        this.knownServices[nodeService.id] = nodeService.port;
        this.socket.connect(nodeService.port);
        this.emit('connected', nodeService.port);
      }
    }
    emitter.on('nodeAdded', this._onNodeAdded);
    emitter.on('nodeRemoved', this._onNodeRemoved);
  }

  /**
   * Connect to the service of a newly added node.
   * @param {Node} node
   * @private
   */
  _onNodeAdded(node) {
    for (let serviceId in node.services) {
      if (this.service.id == serviceId && !this.knownServices[serviceId]) {
        this.knownServices[serviceId] = node.services[serviceId];
        this.socket.connect(node.services[serviceId]);
        break;
      }
    }
  }

  /**
   * Disconnect and remove a node from known services.
   * @param {Node} node
   * @private
   */
  _onNodeRemoved(node) {
    for (let serviceId in node.services) {
      if (this.knownServices[serviceId]) {
        this.socket.disconnect(this.knownServices[serviceId]);
        this.emit('disconnected', this.knownServices[serviceId]);
        delete this.knownServices[serviceId];
        break;
      }
    }
  }
}

module.exports = Listener;
