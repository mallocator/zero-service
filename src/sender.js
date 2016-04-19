'use strict';

var store = require('./store');


class Sender {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
  }



  addService(type, options) {
    // TODO send new service to cluster
    // TODO return some more info than just the id (best is the same what's in removeService)
    this.emit('serviceAdded', options.id)
  }

  removeService(id) {
    // TODO remove service from cluster
    // TODO show more info then just id (such as address or the node name)
    this.emit('serviceRemoved', id);
  }
}

module.exports = Sender;
