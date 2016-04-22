'use strict';

var zmq = require('zmq');


/**
 * Listener that awaits new nodes to which it replies with a list of known nodes in the cluster.
 */
class Listener {
  /**
   * @param {Options} options
   * @param {EventEmitter} emitter
   */
  constructor(options, emitter) {
    this.options = options;
    this.knownNodes = {
      [this.options.id] : {
        id: this.options.id,
        host: this.options.listen,
        services: {}
      }
    };
    this.emitter = emitter;
    this.emitter.on('nodeAdded', this._onNodeAdded.bind(this));
    this.emitter.on('nodeRemoved', this._onNodeRemoved.bind(this));
    this.emitter.on('serviceAdded', this._onServiceAdded.bind(this));
    this.emitter.on('serviceRemoved', this._onServiceRemoved.bind(this));
    this.socket = zmq.socket('rep');
  }

  start() {
    this.socket.on('message', node => {
      node = JSON.parse(node.toString('utf8'));
      if (node.cluster == this.options.cluster.name) {
        delete node.cluster;
        this.options.debug('Handshake listener received a connect request:', node);
        this.socket.send(JSON.stringify(this.knownNodes), null, err => {
          err && this.emitter.emit('error', err instanceof Error ? err : new Error(err));
        });
        this.emitter.emit('nodeAdded', node);
      } else {
        this.options.debug('Rejecting node join request because it belongs to a different cluster:', node);
        this.emitter.emit('nodeRejected', node);
      }
    });

    this.socket.bind(this.options.listen, err => {
      if (err) {
        return this.emitter.emit('error', err instanceof Error ? err : new Error(err));
      }
      this.options.debug('Handshake listener successfully bound to', this.options.listen);
      this.emitter.emit('listenerStarted');
    });
  }

  stop() {
    this.socket.unbind(this.options.listen, err => {
      this.options.debug('Handshake listener has been unbound from', this.options.listen);
      this.emitter.emit('listenerStopped');
    });
  }

  /**
   * Triggered when we receive a new node connection that is trying to join the cluster. Updates the information that we
   * send to new connecting nodes.
   * @param {Node} node
   * @private
     */
  _onNodeAdded(node) {
    this.options.debug('Handshake listener added a new peer node: ', node);
    this.knownNodes[node.id] = node;
  }

  /**
   * Triggered when a node left the cluster. Updates the information that we send to new connecting nodes.
   * @param {Node} node
   * @private
   */
  _onNodeRemoved(node) {
    this.options.debug('Handshake listener added a new peer node: ', node);
    delete this.knownNodes[node.id];
  }

  /**
   * Stores the information about all the known nodes. Triggered whenever a node adds a new service. Updates the
   * information that we send to new connecting nodes.
   * @param {Service} service
   * @private
   */
  _onServiceAdded(service) {
    this.knownNodes[service.node].services[service.id] = service;
  }

  /**
   * Triggered whenever a service has ben stopped. Updates the information that we send to new connecting nodes.
   * @param {Service} service
   * @private
   */
  _onServiceRemoved(service) {
    delete this.knownNodes[service.node].services[service.id];
  }
}

module.exports = Listener;
