'use strict';

var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var events = require('eventemitter2');
var shortId = require('shortid');

var Cluster = require('./src/cluster');
var Store = require('./src/store');
var On = require('./src/on');
var opts = require('./src/options');

/**
 * This class bundles the API which allows a user to connect to a cluster and announce services.
 */
class ZeroService extends events {
  /**
   * @event connected Fired when we successfully connected to the cluster. Is fired when both listening and discovered
   * have been fired.
   */

  /**
   * @event disconnected Fired when we disconnected form the cluster and are no longer listening for incoming nodes.
   */

  /**
   * @event listening Fired when we start listening for connecting nodes.
   */

  /**
   * @event discovered Fired when we have successfully discovered a node and set up communication with it.
   */

  /**
   * @event ZeroService#nodeAdded  Fired when a node is added either from the network or locally
   * @type {Object}
   * @property {string} id  The id of the new node
   * @property {string} address The address of the new node
   * @property {string[]} A list of services that was running on this node
   */

  /**
   * @event nodeRemoved  Fired when a node is removed either from the network or locally
   * @type {Object}
   * @property {string} id  The id of the new node
   * @property {string} address The address of the new node
   * @property {string[]} A list of services that was running on this node
   */

  /**
   * @event serviceAdded  Fired when a service is added either from the network or locally
   * @type {string}  The id of the service that has just been added
   */

  /**
   * @event serviceRemoved  Fired when a service is removed either from the network or locally
   * @type {string}  The id of the service that has just been added
   */

  /**
   *
   * @param {Object|string} [options]  Global options object for this node or a path to a filename holding the options
   * @param {string} [options.id] A unique id to identify this node
   * @param {string|number} [options.handshake=2205]  Port on which to initialize a cluster connection. This can either
   * be a number which will be used to bind to tcp://0.0.0.0:<port> or the complete host string.
   * @param {string|number} [options.listen]  Port on which to listen for cluster broadcasts.This can either be a number
   * which will be used to bind to tcp://0.0.0.0:<port> or the complete host string.
   * @param {Object} [options.discovery]  Discovery options object, properties depend on the type
   * @param {string} [options.discovery.type='multicast'] The type of discovery to be used
   * @param {string|string[]} [options.discovery.hosts] Used for type unicast. A list of nodes we should attempt connecting
   * to. Note that the port of the host should be the handshake port of that node.
   */
  constructor(options) {
    super({
      newListener: false
    });
    this.options = opts.normalize(options);
    this.store = new Store(this.options, this);
    this.cluster = new Cluster(this.options, this);
    this.on = new On(this);
    this.methods = [];
  }

  /**
   * Starts looking for other nodes using the given discovery method and listening for incoming node connects.
   * @fires connected
   * @fires listening
   * @fires discovered
   */
  connect() {
    this._discover();
    this.cluster.connect();
  }

  /**
   * @fires disconnected
   */
  disconnect() {
    this.receiver.stop();
  }

  /**
   * Adds a new service to the cluster and makes it available to all the nodes.
   * @fires serviceAdded
   * @param {string} type               The type of service you want to register (any name you seem fit)
   * @param {Object} [options]          Optional options that otherwise will be auto generated
   * @param {String} [options.address]  Set your own custom address with which zeromq can talk to this service
   * @param {String} [options.id]       Set your own id, otherwise the library will generate one for you
   * @returns {string} The unique id of this service
   */
  addService(type, options) {
    var id = options && options.id ? options.id : shortId.generate();
    var service = {
      id,
      type,
      node: this.options.id
    };
    this.propagator.addService(service);
    return id;
  }

  /**
   * Removes a node from the cluster.
   * @fires serviceRemoved
   * @param id
   */
  removeService(id) {
    this.send.removeService(id);
  }

  // TODO check the zeromq docs for the exact api that we're trying to replicate here
  /**
   * Send a message to one node of the given service type and wait for an answer.
   * @param type
   * @param payload
   * @param cb
     */
  req(type, payload, cb) {

  }

  // TODO check the zeromq docs for the exact api that we're trying to replicate here
  /**
   * Receive a message from from a node that expects an answer.
   * @param type
   * @param callback
     */
  res(type, callback) {

  }

  // TODO check the zeromq docs for the exact api that we're trying to replicate here
  /**
   * Send a message to one node of the given service type without expecting an answer.
   * @param type
   * @param payload
     */
  push(type, payload) {
    // TODO if the type doesn't exist, register it.
    // TODO send a request to one of the servers of this type
  }

  // TODO check the zeromq docs for the exact api that we're trying to replicate here
  /**
   * Receive a message without having to reply to it.
   * @param type
   * @param callback
     */
  pull(type, callback) {
    // TODO if the type doesn't exist, register it.
    // TODO register a replier who will answer when a request of this type has been received.
  }

  /**
   * Publish a message to all nodes of the given service type without waiting for any acknowledgements.
   * @param type
   * @param payload
     */
  pub(type, payload) {
    // TODO if the type doesn't exist, register it.
    // TODO send the payload to all known nodes with this service
  }

  /**
   * Listen to messages of a given type without having to acknowledge the reception (The publisher doesn't care).
   * @param type
   * @param callback  Called when a message has been received
     */
  sub(type, callback) {
    // TODO if the type doesn't exist, register it.
    // TODO receive payload from any node
  }

  /**
   * Pair with one other node of the given type that has not been paired with any other so far.
   * @param type
   * @param callback  Called when a connection has been established
     */
  pair(type, callback) {
  }

  /**
   * Send and receive messages to/from all services of the given type in round robin mode. Messages are queued until
   * a service has received the message.
   * @param type
   * @param callback  Called whenever a message is acknowledged
   */
  dealer(type, callback) {
  }

  /**
   * Send and receive messages to/from all services of the given type in round robin mode. Messages that have no
   * recipient are discarded.
   * @param type
   * @param callback  Called whenever a message has been received
   */
  router(type, callback) {
  }

  /**
   * @fires discovered
   * @private
   */
  _discover() {
    var files = fs.readdirSync(path.join(__dirname, '/src', '/discovery'));
    for (let file of files) {
      let fileType = path.basename(file, path.extname(file));
      if (fileType == this.options.discovery.type) {
        this.methods[this.options.discovery.type] = require(path.join(__dirname, '/src', '/discovery', file));
        this.methods[this.options.discovery.type].discover(this.options, this);
      }
    }
    throw new Error('Unable to find discovery method of type ' + this.options.discovery.type);
  }
}

module.exports = ZeroService;
