'use strict';

var zmq = require('zmq');


class Publish {
  constructor(emitter) {
    this.emitter = emitter;
    this.services = {};
    this.emitter.on('nodeAdded', this._onNodeAdded.bind(this));
    this.emitter.on('nodeRemoved', this._onNodeRemoved.bind(this));
  }

  publish(type, msg, flags, cb) {
    if (!this.services[type]) {
      this.services[type] = zmq.socket('pub');
    }
    this.services[type].send(msg, flags, cb);
  }

  _onNodeAdded(node) {
    for (let service in node.services) {
      this.services[service.type] && this.services[service.type].connect(node.host);
    }
  }

  _onNodeRemoved(node) {
    for (let service in node.services) {
      this.services[service.type] && this.services[service.type].disconnect(node.host);
    }
  }
}

module.exports = Publish;
