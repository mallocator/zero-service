'use strict';

var zmq = require('zmq');


class Receiver {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.socket = zmq.socket('sub');
  }

  /**
   * @fires listening
   */
  start(node) {
    // TODO subscribe to n nodes for updates about the cluster
    // TODO listen to events coming in and dispatch them to the event listeners
  }

  /**
   * @fires disconnected
   */
  stop() {
    // TODO shut down listening port and unregister listeners (if necessary)
    this.emit('disconnected');
  }


  _onNodeAdded(node) {
    this.socket.connect(node.host, err => {
      // TODO handle err
    });
  }

  _onNodeRemoved() {
    this.socket.disconnect(node.host, err => {
      // TODO handle err
    });
  }

  _onServiceAdded() {
    this.emit('serviceAdded', id)
  }

  _onServiceRemoved() {
    this.emit('serviceRemoved', id);
  }
}

module.exports = Receiver;
