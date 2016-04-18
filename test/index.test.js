'use strict';

var expect = require('chai').expect;

var Zero = require('../');


describe('zero-services', () => {
  it('should connect to a cluster', () => {
    new Zero();
  });
});
