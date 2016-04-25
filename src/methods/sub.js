'use strict';

var events = require('eventemitter2');
var zmq = require('zmq');


class Sub extends events {
  /**
   * @param emitter     The global emitter
   * @param service     The service to subscribe to
   * @param knownNodes  All the nodes this node known about
     */
  constructor(emitter, service, knownNodes) {
    super();
    this.service = service;
    this.knownServices = {};
    this.socket = zmq.socket('sub');
    this.socket.on('message', msg => this.emit('message', msg));
    for (let id of knownNodes) {
      var nodeService = knownNodes[id].services[service.id];
      if (nodeService) {
        this.knownServices[nodeService.id] = nodeService.port;
        this.socket.connect(nodeService.port);
        this.emit('connceted', nodeService.port);
      }
    }
    emitter.on('nodeAdded', this._onNodeAdded);
    emitter.on('nodeRemoved', this._onNodeRemoved);
  }

  subscribe(topic) {
    this.socket.subscribe(topic);
  }

  _onNodeAdded(node) {
    for (let serviceId in node.services) {
      if(this.service.id == serviceId && !this.knownServices[serviceId]) {
        this.knownServices[serviceId] = node.services[serviceId];
        this.socket.connect(node.services[serviceId]);
        break;
      }
    }
  }

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

module.exports = Sub;
