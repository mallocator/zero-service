'use strict';

var zmq = require('zmq');


class Propagator {
  /**
   *
   * @param options
   * @param emitter
   * @fires listening
   * @fires nodeAdded
   * @fires nodeRemoved
   * @fires error
   */
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.socket = zmq.socket('pub');
    this.socket.on('accept', (socket, host) => {
      emitter.emit('nodeAdded', { host });
    });
    this.socket.on('close', (socket, host) => {
      emitter.emit('nodeRemoved', { host });
    });
    this.socket.bind(options.listen, err => {
      emitter.emit('listening');
      err && emitter.emit('error', err instanceof Error ? err : new Error(err));
    });
  }

  /**
   * Send a message that a new service has been added to all listening nodes.
   * @param {object} service
   * @fires serviceAdded
   */
  addService(service) {
    this.socket.send('serviceAdded ' + JSON.stringify(service), err => {
      if (err) {
        this.emitter.emit('error', err instanceof Error ? err : new Error(err));
      } else {
        this.emitter.emit('serviceAdded', service);
      }
    });
  }

  /**
   * Sends a message that a service has been removed to all listening nodes
   * @param service
   * @fires serviceRemoved
   */
  removeService(service) {
    this.socket.send('serviceAdded ' + JSON.stringify(service), err => {
      if (err) {
        this.emitter.emit('error', err instanceof Error ? err : new Error(err));
      } else {
        this.emit('serviceRemoved', service);
      }
    });
  }
}

module.exports = Propagator;
