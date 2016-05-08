'use strict';

var Sender = require('./sender');


class Push extends Sender {
  constructor(address) {
    super('push', address);
  }
}

module.exports = Push;
