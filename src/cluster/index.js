'use strict';

var Listener = require('./listener');
var Sender = require('./sender');
var Receiver = require('./receiver');
var Broadcaster = require('./broadcaster');

class Cluster {
  constructor(options, emitter) {
    this.options = options;
    this.emitter = emitter;
    this.listener = new Listener(options, emitter);
    this.sender = new Sender(options, emitter);
    this.receiver = new Receiver(options, emitter);
    this.broadcaster = new Broadcaster(options, emitter);
  }

  connect() {
    this.listener.start();
    // TODO register event listeners that propagate nodes and services to other nodes.
    // The actual replication depends on the algorithm chosen.
  }

  addService(type) {
    // TODO broadcast to the cluster that you offer this service
  }

  removeService(type) {
    // TODO broadcast to the cluster that you no longer offer this service
  }
}

module.exports = Cluster;
