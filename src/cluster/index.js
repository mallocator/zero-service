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
  }

}

module.exports = Cluster;
