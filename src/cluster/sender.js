'use strict';

var _ = require('lodash');
var zmq = require('zmq');

/**
 * A connector class that creates an initial connection to another node to receive a connectible cluster state
 */
class Sender {
  /**
   * @param {Options} options
   * @param {EventEmitter} emitter
   */
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.connected = false;
    this.socket = zmq.socket('req');
    this.ownHost = {
      cluster: this.options.cluster.name,
      id: this.options.id,
      host: this.options.listen,
      services: {}
    };
    emitter.on('connected', () => {
      this.connected = true;
    });
    emitter.on('disconnected', () => {
      this.connected = false;
    });
    emitter.on('discovered', this._connect.bind(this));
    emitter.on('serviceAdded', this._onServiceAdded.bind(this));
    emitter.on('serviceRemoved', this._onServiceRemoved.bind(this));
  }

  /**
   * Creates an initial connection to a potential cluster node and let's it know on which port we're listening.
   * @param nodes
   * @private
   */
  _connect(nodes, attempt = 0) {
    if (this.connected) {
      this.options.debug('Not trying to initiate handshake as we already seem to be connected');
      return;
    }
    this.socket.removeAllListeners();

    nodes = _.isArray(nodes) ? nodes : [nodes];
    let node = nodes[attempt];
    this.socket.connect(node);
    this.options.debug('Handshake sender has connected to ' + node);

    this.socket.once('message', msg => {
      this.options.debug('Handshake sender received node list from ' + node);
      this.emitter.emit('clusterFound', JSON.parse(msg.toString('utf8')));
      this.socket.disconnect(node);
      this.socket.unmonitor();
    });

    this.socket.send(JSON.stringify(this.ownHost), null, err => {
      this.options.debug('Handshake sender sent node list request to ' + node);
      err && this.emitter.emit('error', err instanceof Error ? err : new Error(err));
    });

    this.socket.once('connect_retry', this._connect.bind(this, nodes, attempt + 1));
    this.socket.once('accept_failed', this._connect.bind(this, nodes, attempt + 1));
    this.socket.once('disconnect', this._connect.bind(this, nodes, attempt + 1));
    this.socket.monitor();
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
