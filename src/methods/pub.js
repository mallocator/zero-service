'use strict';

var Sender = require('./sender');


class Pub extends Sender {
  constructor(address) {
    super('pub', address);
  }
}

module.exports = Pub;
