'use strict'

var expect = require('chai').expect;


describe('broadcast', () => {
  describe('nodes', () => {
    it('should send a message to the only other connected node');

    it('should send a message to all connected nodes');

    it('should ignore broadcasts if no nodes are connected');

    it('should notify other nodes if one node disappears');
  });

  describe('services', () => {
    describe('DB strategy', () => {
      it('should send a new service to all other nodes in the cluster');

      it('should remove a node from all other nodes in the cluster');
    });

    describe('Network strategy', () => {
      it('should ask all other nodes for a specific service');
    })
  });
});
