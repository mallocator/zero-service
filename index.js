'use strict';

var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var events = require('eventemitter2');
var On = require('onall');

var Cluster = require('./src/cluster');
var Dealer = require('./src/methods/dealer');
var opts = require('./src/options');
var Pub = require('./src/methods/pub');
var Pull = require('./src/methods/pull');
var Push = require('./src/methods/push');
var Rep = require('./src/methods/rep');
var Req = require('./src/methods/req');
var Router = require('./src/methods/router');
var Sub = require('./src/methods/sub');

/**
 * A node holds all information about one instance of ZeroService with all the services that are registered to that
 * instance.
 * @typedef {object} Node
 * @property {string} id          A unique id to identify this node
 * @property {string} host        A host address that is usable by zeromq
 * @property {Service[]} services A list of services that are available on this node
 */

/**
 * Holds the information for a service that is made available on a node. A service always needs to have an existing
 * node.
 * @typedef {object} Service
 * @property {string} id    A unique id to identify this service
 * @property {string} node  The node id to which this service belongs
 * @property {number} port  The port on which we can connect to this service on other nodes
 */

/**
 * This class bundles the API which allows a user to connect to a cluster and announce services.
 */
class ZeroService extends events {
  /**
   * @event connected Fired when we successfully connected to the cluster. Is fired when both listening and discovered
   * have been fired.
   */

  /**
   * @event disconnected Fired when we disconnected form the cluster and are no longer receiving updates.
   */

  /**
   * @event listening Fired when we start listening for connecting nodes to which to publish messages to.
   */

  /**
   * @event ignoring Fired when the broadcaster no longer accepts connections from receivers and is turned off.
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
   * @param {Options} [options]  Global options object for this node or a path to a filename holding the options
   */
  constructor(options) {
    super({
      newListener: false
    });
    this.options = opts.normalize(options);
    this.cluster = new Cluster(this.options, this);
    this.on = new On(this);
    this.methods = [];
  }

  /**
   * Starts looking for other nodes using the given discovery method and listening for incoming node connects.
   * @fires discovered
   * @fires listening
   * @fires connected
   */
  connect() {
    this._discover();
    this.cluster.connect();
  }

  /**
   * @fires ignoring
   * @fires disconnected
   */
  disconnect() {
    this.receiver.stop();
  }

  /**
   * Send a message to one node of the given service type and wait for an answer.
   * @param type
   * @returns {Req}
   */
  req(type) {
    return new Req(this, {id: type}, this.cluster.nodes);
  }

  /**
   * Receive a message from from a node that expects an answer.
   * @param type
   * @returns {Rep}
   */
  rep(type, port) {
    // TODO register new service in cluster based on type and port
    // TODO get own address to subscribe to
    return new Rep(address);
  }

  /**
   * Send a message to one node of the given service type without expecting an answer.
   * @param type
   * @returns {Push}
   */
  push(type, port) {
    // TODO would be better if this "service" was a reference to our own service instance
    return new Push(address);
  }

  /**
   * Receive a message without having to reply to it.
   * @param type
   * @returns {Pull}
   */
  pull(type) {
    // TODO would be better if this "service" was a reference to our own service instance
    return new Pull(this, {id: type}, this.cluster.nodes);
  }

  /**
   * Publish a message to all nodes of the given service type without waiting for any acknowledgements.
   * @param type
   * @param {number} [port] The port on which to create this service. If none is given, one will be assigned automatically.
   * @returns {Pub}
   */
  pub(type, port) {
    // TODO register new service in cluster based on type and port
    // TODO get own address to subscribe to
    return new Pub(address);
  }

  /**
   * Listen to messages of a given type without having to acknowledge the reception (The publisher doesn't care).
   * @param type
   * @returns {Sub}
   */
  sub(type) {
    // TODO would be better if this "service" was a reference to our own service instance
    return new Sub(this, {id: type}, this.cluster.nodes);
  }

  /**
   * Send and receive messages to/from all services of the given type in round robin mode. Messages are queued until
   * a service has received the message.
   * @param type
   * @param callback  Called whenever a message is acknowledged
   */
  dealer(type, callback) {
    // TODO pass in arguments when implemented
    return new Dealer();
  }

  /**
   * Send and receive messages to/from all services of the given type in round robin mode. Messages that have no
   * recipient are discarded.
   * @param type
   * @param callback  Called whenever a message has been received
   */
  router(type, callback) {
    // TODO pass in arguments when implemented
    return new Router();
  }

  /**
   * Adds a new service to the cluster and makes it available to all the nodes.
   * @fires serviceAdded
   * @param {string|string[]} type      The type of service you want to register (any name you seem fit)
   * @param {Object} [options]          Optional options that otherwise will be auto generated
   * @param {String} [options.address]  Set your own custom address with which zeromq can talk to this service
   * @param {String} [options.id]       Set your own id, otherwise the library will generate one for you
   * @returns {ZeroService|ZeroService[]}
   */
  _addService(type, options) {
    // TODO Maybe even move this into a parent class for req/push/pub
    // TODO this should be done implicitly when a rep/push/pub service is created.
    type = _.isArray(type) ? type : [type];
    var services = [];
    for (let id of _.uniq(type)) {
      var port = options && options.port ? options.port : 2207;
      var service = {
        id,
        port,
        node: this.options.id
      };
      services.push(service);
      this.cluster.addService(service);
    }
    return services.length <= 1 ? services[0] : services;
  }

  /**
   * Removes a service from the cluster.
   * @fires serviceRemoved
   * @param {string|string[]} type   The type of the service you want to remove from the cluster.
   * @returns {ZeroService}
   */
  _removeService(type) {
    // TODO Maybe even move this into a parent class for req/push/pub
    // TODO this should be done implicitly when a rep/push/pub service is stopped.
    type = _.isArray(type) ? type : [type];
    for (let id of _.uniq(type)) {
      this.cluster.removeService(id);
    }
    return this;
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
