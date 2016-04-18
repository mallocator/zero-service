'use strict';

var store = require('./store');


class Listener {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
  }


  /**
   * @fires listening
   */
  start() {
    // TODO listen to events coming in and dispatch them to the event listeners
    this.emit('listening');
  }

  /**
   * @fires disconnected
   */
  stop() {
    // TODO shut down listening port and unregister listeners (if necessary)
    this.emit('disconnected');
  }

  _onNodeAdded() {
    this.emit('nodeAdded', id)
  }

  _onNodeRemoved() {
    this.emit('nodeRemoved', id)
  }

  _onServiceAdded() {
    this.emit('serviceAdded', id)
  }

  _onServiceRemoved() {
    this.emit('serviceRemoved', id);
  }
}

module.exports = Listener;
