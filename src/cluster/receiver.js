'use strict';

var _ = require('lodash');
var zmq = require('zmq');


class Receiver {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    emitter.on('clusterFound', this._onNodesAdded.bind(this));
    this.socket = zmq.socket('sub');
    this.knownHosts = {};
  }

  _onNodesAdded(nodes) {
    nodes = _.isArray(nodes) ? nodes : [ nodes ];
    for (let node of nodes) {
        // TODO limit number of nodes to connect to via options
      if (!this.knownHosts[node]) {
        this.socket.connect(node.host);
        this.options.debug('Receiver connected to host', node.host);
        this.socket.subscribe('nodeAdded');
        this.socket.subscribe('nodeRemoved');
        this.socket.subscribe('serviceAdded');
        this.socket.subscribe('serviceRemoved');
        this.socket.on('message', this.emitter.emit);
      }
    }
  }
}

module.exports = Receiver;
