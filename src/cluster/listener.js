'use strict';

var zmq = require('zmq');


/**
 * Listener that awaits new nodes to which it replies with a list of known nodes in the cluster.
 */
class Listener {
  constructor(options, emitter) {
    this.options = options;
    this.knownNodes = [ { host: this.options.listen } ];
    this.emitter = emitter;
    this.emitter.on('nodeAdded', this._onNodeAdded.bind(this));
    this.socket = zmq.socket('rep');
  }

  start() {
    this.socket.on('message', host => {
      host = JSON.parse(host.toString('utf8'));
      this.options.debug('Handshake listener received a connect request:', host);
      this.socket.send(JSON.stringify(this.knownNodes));
      this.emitter.emit('nodeAdded', { host });
    });

    this.socket.bind(this.options.handshake, err => {
      if (err) {
        return this.emitter.emit('error', err instanceof Error ? err : new Error(err));
      }
      this.options.debug('Handshake listener successfully bound to', this.options.handshake);
      this.emitter.emit('listenerStarted');
    });
  }

  stop() {
    this.socket.unbind(this.options.handshake, err => {
      this.options.debug('Handshake listener has been unbound from', this.options.handshake);
      this.emitter.emit('listenerStopped');
    });
  }

  _onNodeAdded(node) {
    this.options.debug('Handshake listener added a new peer node: ', node);
    this.knownNodes.push(node);
  }
}

module.exports = Listener;
