'use strict';

var _ = require('lodash');
var zmq = require('zmq');


/**
 * The receiver is responsible for relaying all state updates of the cluster. The receiver connects to multiple nodes
 * and translates cluster events to local events.
 */
class Receiver {
  /**
   * @param {Options} options
   * @param {EventEmitter} emitter
   */
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.emitter.on('clusterFound', this._onNodesAdded.bind(this));
    this.emitter.on('nodeAdded', this._onNodesAdded.bind(this));
    this.emitter.on('nodeRemoved', this._onNodeRemoved.bind(this));
    this.socket = zmq.socket('sub');
    this.knownNodes = {};
  }

  /**
   * Adds the node to this hosts list of known nodes.
   * @param {Node|Node[]} nodes
   * @fires nodeRemoved
   * @fires connected
   * @private
     */
  _onNodesAdded(nodes) {
    nodes = _.isArray(nodes) ? nodes : [ nodes ];
    for (let node of nodes) {
      if (this.knownNodes[node.id]) {
        this.options.debug('Receiver is ignoring host because this node already knows it', node.host);
      } else if(Object.keys(this.knownNodes).length > this.options.nodes.maxPeers) {
        this.options.debug('Receiver is ignoring host because maxPeers(', this.options.nodes.maxPeers, ') was reached: ', node.host);
      } else {
        // TODO monitor the socket so that if a node disconnects we can notify the rest of the cluster that it's gone
        this.knownNodes[node.id] = node;
        this.socket.connect(node.host);
        this.options.debug('Receiver connected to host', node.host);
        this.socket.subscribe('nodeAdded');
        this.socket.subscribe('nodeRemoved');
        this.socket.subscribe('serviceAdded');
        this.socket.subscribe('serviceRemoved');
        this.socket.on('message', this._onMessage.bind(this));
        this.emitter.emit('connected');
      }
    }
  }

  /**
   * @param {Buffer} topic
   * @param {Buffer} msg
   * @private
     */
  _onMessage(topic, msg) {
    this.emitter.emit(topic.toString('utf8'), JSON.parse(msg.toString('utf8')));
  }

  /**
   * @param {Node} node
   * @fires disconnected
   * @private
     */
  _onNodeRemoved(node) {
    this.socket.disconnect(node.host);
    delete this.knownNodes[node.id];
    if(!this.knownNodes.length) {
      this.emitter.emit('disconnected');
    }
  }
}

module.exports = Receiver;
