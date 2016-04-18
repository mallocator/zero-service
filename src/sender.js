'use strict';

var store = require('./store');


class Sender {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
  }



  addService(type, options ) {
    // TODO send new service to cluster
    // TODO return some more info than just the id (best is the same what's in removeService)
    this.emit('serviceAdded', id)
  }

  removeService(id) {
    this.emit('serviceRemoved', id);
  }
}
