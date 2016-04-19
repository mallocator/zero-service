'use strict';

var _ = require('lodash');
var zmq = require('zmq');

/**
 * A connector class that creates an initial connection to another node to receive a connectable cluster state
 */
class Sender {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.socket = zmq.socket('req');
    emitter.on('discovered', this._connect.bind(this));
  }

  /**
   * Creates an initial connection to a potential cluster node and let's it know on which port we're listening.
   * @param node
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
      this.emitter.emit('clusterFound', JSON.parse(msg.toString('utf8')));
      zmq.disconnect(node);
    });

    this.socket.send(JSON.stringify(this.options.listen), err => {
      this.options.debug('Handshake sender sent node list request to ' + node.host);
      if (err) {
        return this.emitter.emit('error', err instanceof Error ? err : new Error(err));
      }
    });
  }
}

module.exports = Sender;
