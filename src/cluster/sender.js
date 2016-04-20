'use strict';

var _ = require('lodash');
var zmq = require('zmq');

/**
 * A connector class that creates an initial connection to another node to receive a connectable cluster state
 */
class Sender {
  /**
   * @param {Options} options
   * @param {EventEmitter} emitter
   */
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.socket = zmq.socket('req');
    this.ownHost = {
      id: this.options.id,
      host: this.options.listen,
      services: {}
    };
    emitter.on('discovered', this._connect.bind(this));
    emitter.on('serviceAdded', this._onServiceAdded.bind(this));
    emitter.on('serviceRemoved', this._onServiceRemoved.bind(this));
  }

  /**
   * Creates an initial connection to a potential cluster node and let's it know on which port we're listening.
   * @param nodes
   * @private
   */
  _connect(nodes) {
    nodes = _.isArray(nodes) ? nodes : [nodes];
    // TODO try to connect to multiple nodes until one is successful
    let node = nodes[0];
    this.socket.connect(node.host);
    this.options.debug('Handshake sender has connected to ' + node.host);

    this.socket.on('message', msg => {
      this.options.debug('Handshake sender received node list from ' + node.host);
      zmq.disconnect(node);
      this.emitter.emit('clusterFound', JSON.parse(msg.toString('utf8')));
    });

    this.socket.send(JSON.stringify(this.ownHost), null, err => {
      this.options.debug('Handshake sender sent node list request to ' + node.host);
      err && this.emitter.emit('error', err instanceof Error ? err : new Error(err));
    });
  }

  /**
   * Updates the information that we send on first connection to the cluster we are bout to join.
   * @param {Service} service
   * @private
   */
  _onServiceAdded(service) {
    if (service.node == this.ownHost.id) {
      this.ownHost.services[service.id] = service;
    }
  }

  /**
   * Updates the information that we send on first connection to the cluster we are bout to join.
   * @param {Service} service
   * @private
   */
  _onServiceRemoved(service) {
    if (service.node == this.ownHost.id) {
      delete this.ownHost.services[service.id];
    }
  }
}

module.exports = Sender;
