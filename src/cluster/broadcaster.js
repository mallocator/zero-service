'use strict';

var zmq = require('zmq');


class Broadcaster {
  /**
   * @param {Options} options
   * @param {EventEmitter} emitter
   */
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.socket = zmq.socket('pub');
    this.socket.bind(options.listen, err => {
      if (err) {
        return this.emitter.emit('error', err instanceof Error ? err : new Error(err));
      }
      this.options.debug('Broadcaster is listening as', options.listen);
      this.emitter.emit('listening');
    });
    this.knownNodes = {};
    this.emitter.on('nodeAdded', this._onNodeAdded.bind(this));
    this.emitter.on('nodeRemoved', this._onNodeRemoved.bind(this));
    this.emitter.on('serviceAdded', this._onServiceAdded.bind(this));
    this.emitter.on('serviceRemoved', this._onServiceRemoved.bind(this));
  }

  send(topic, msg) {
    this.socket.send([topic, JSON.stringify(msg)], null, err => {
      err &&  this.emitter.emit('error', err instanceof Error ? err : new Error(err));
    });
  }

  /**
   * Will send information to other peers that a node has been added if we don't already know about it. This will prevent
   * endless sending of node joins.
   * @param {Node} node
   * @private
     */
  _onNodeAdded(node) {
    // TODO if we want to use different algorithms to decide the communication patter, this is where it should be used.
    if (!this.knownNodes[node.id]) {
      this.knownNodes[node.id] = node;
      this.send('nodeAdded', node);
    }
    if(this.knownNodes.length > this.options.nodes.maxPeers) {
      this.options.nodes.checkNetwork = true;
    }
  }

  /**
   * Will send information to other peers the a node has been added if we know this node. This prevents endless sending
   * of node departures.
   * @param {Node} node
   * @private
     */
  _onNodeRemoved(node) {
    if (this.knownNodes[node.id]) {
      delete this.knownNodes[node.id];
      this.send('nodeRemoved', node);
    }
    if(this.knownNodes.length == this.options.nodes.maxPeers) {
      this.options.nodes.checkNetwork = false;
    }
  }

  /**
   * If we just added a service, we notify the other receivers.
   * @param {Service} service
   * @private
   */
  _onServiceAdded(service) {
    if (service.node == this.options.id) {
      this.send('serviceAdded', service);
    }
  }

  /**
   * If we just removed a service, we notify the other receivers.
   * @param {Service} service
   * @private
   */
  _onServiceRemoved(service) {
    if (service.node == this.options.id) {
      this.send('serviceRemoved', service);
    }
  }
}

module.exports = Broadcaster;
