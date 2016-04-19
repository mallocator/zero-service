'use strict';

var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var events = require('eventemitter2');
var shortId = require('shortid');

var Listener = require('./src/listener');
var Sender = require('./src/sender');
var Store = require('./src/store');
var On = require('./src/on');


/**
 * The default options object, that will be combined with any passed in options.
 */
var defaultOptions = {
  custer: {
    name: 'zero'
  },
  port: 2206,
  discovery: {
    type: 'multicast'
  },
  nodes: {
    maxPeers: Number.POSITIVE_INFINITY
  }
};

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
   * @event listening Fired when we start listening to connecting nodes.
   */

  /**
   * @event discovered Fired when we have successfully discovered a node and told it about this node.
   */

  /**
   * @event nodeAdded  Fired when a node is added either from the network or locally
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
   * @param {number} [options.port=2206]  Port on which to listen for connecting nodes
   * @param {Object} [options.discovery]  Discovery options object, properties depend on the type
   * @param {string} [options.discovery.type='multicast'] The type of discovery to be used
   */
  constructor(options) {
    super({
      newListener: false
    });
    if (_.isString(options)) {
      options = require(path.join(module.main.filename, options));
    }
    options = options || {};
    this.options = Object.assign({}, defaultOptions, options);
    this.listener = new Listener(this.options, this);
    this.sender = new Sender(this.options, this);
    this.store = new Store(this.options, this);
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
    this.on.allOnce(['listening', 'discovered'], () => {
      this.emit('connected');
    });
    this.listener.start();
    this._discover();
  }

  /**
   * @fires disconnected
   */
  disconnect() {
    this.listener.stop();
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
    this.sender.addService(type, options);
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
        return this.methods[this.options.discovery.type].discover(this.options, this);
      }
    }
    throw 'Unable to find discovery method of type ' + this.options.discovery.type;
  }
}

module.exports = ZeroService;
