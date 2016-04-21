'use strict';

var path = require('path');

var _ = require('lodash');
var shortId = require('shortid');


/**
 * The options object that is made available to all instances in the service.
 * @typedef {object} Options
 * @property {string} [id]                          A unique id to identify this node
 * @property {string|number} [listen=2206]          Port on which to listen for cluster broadcasts.This can either be a number
 *                                                  which will be used to bind to tcp://0.0.0.0:<port> or the complete host
 *                                                  string.
 * @property {Object} [discovery]                   Discovery options object, properties depend on the type
 * @property {string} [discovery.type='multicast']  The type of discovery to be used
 * @property {string|string[]} [discovery.hosts]    Used for type unicast. A list of nodes we should attempt connecting to.
 *                                                  Note that the port of the host should be the handshake port of that node.
 * @property {object} [nodes]                       Configuration options regarding nodes
 * @property {object} [node.maxPeers=INFINTY]       The maximum number of other nodes this service is going to connect.
 * @property {object} [node.checkNetwork=false]     Flag that decides whether we know about all other nodes or need to ask
 *                                                  around in the cluster. This value is set dynamically and should not be
 *                                                  set by the user.
 */


var ipv4regex = /((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)/;

/**
 * The default options object, that will be combined with any passed in options.
 */
exports.defaultOptions = {
  listen: 2206,
  discovery: {
    type: 'multicast'
  },
  nodes: {
    maxPeers: Number.POSITIVE_INFINITY,
    checkNetwork: false
  },
  debug: false
};

/**
 * The default options for when you choose to use multicast for discovery.
 */
exports.defaultMulticast = {
  type: 'multicast',
  port: 22060,
  address: '0.0.0.0',
  interval: 1000
};

/**
 * Sets default options and verifies that all values are in the right format.
 * @param options
 * @returns {*|{}}
 */
exports.normalize = function(options) {
  if (_.isString(options)) {
    options = require(path.join(module.main.filename, options));
  }
  options = options || {};
  this.options = Object.assign({}, exports.defaultOptions, options);
  for (let prop in this.options) {
    if (this.options.hasOwnProperty(prop) && exports[prop]) {
      exports[prop]();
    }
  }
  return this.options;
};

/**
 * helper function that check wether the host is something that zmq can understand.
 * @param host
 * @returns {Array|{index: number, input: string}|*}
 */
exports.isValidHost = function(host) {
  // TODO make this a better regex
  return !!host.match(/^(tcp|ipc|inproc|pgm|epgm):\/\/\w/);
  // TODO check if we can actually bind to this host/port
};

/**
 * Sets an automatically generate id if none has been given.
 */
exports.id = function() {
  if (this.options.id) {
    this.options.id = this.options.id.trim();
  } else {
    this.options = shortId.generate();
  }
};

/**
 * Makes sure the connection string for broadcasts is something zeromq can understand.
 */
exports.listen = function() {
  if (_.isNumber(this.options.listen)) {
    this.options.listen = 'tcp://0.0.0.0:' + this.options.listen;
  }
  if (!exports.isValidHost(this.options.listen)) {
    throw new Error('Unable to listen with invalid host setting:' + this.options.listen);
  }
};

/**
 * Makes sure the discovery settings are valid.
 */
exports.discovery = function() {
  let methodMap = {
    multicast: 'multicast',
    multi: 'multicast',
    unicast: 'unicast',
    uni: 'uni',
    aws: 'aws',
    amazon: 'aws'
  };
  if (!methodMap[this.options.discovery.type]) {
    throw new Error('Unidentified discovery method: ' + this.options.discovery.type);
  }
  this.options.discovery.type = methodMap[this.options.discovery.type];
  switch(this.options.discovery.type) {
    case 'unicast':
      if(!this.options.discovery.hosts) {
        throw new Error('Unicast requires at least one host to connect to');
      }
      if(!_.isArray(this.options.discovery.hosts)) {
        this.options.discovery.hosts = [this.options.discovery.hosts];
      }
      _.map(this.options.discovery.hosts, elem => elem.trim());
      _.filter(this.options.discovery.hosts, elem => {
        if (elem.length === 0) {
          return false;
        }
        if (!exports.isValidHost(elem)) {
          throw new Error('One of the given hosts is not a valid address that zeromq can understand: ' + elem);
        }
        return true;
      });
      if (!this.options.discovery.hosts.length) {
        throw new Error('No valid hosts were found while in the configuration');
      }
      break;

    case 'multicast':
      this.options.discovery = Object.assign({}, exports.defaultMulticast, this.options.discovery);
      if (!_.isNumber(this.options.discovery.port) || this.options.discovery.port < 1 || this.options.discovery.port > 65535) {
        throw new Error('The multicast port needs to be a valid number between 1 and 65535');
      }
      if (!this.options.discovery.address.match(ipv4regex)) {
        throw new Error('The given address is not a valid ipv4');
      }
      break;

    case 'aws':
      // TODO check for auth tokens
      break;
  }
};

/**
 * If debug is set to true the value is initialized with the console.log function, otherwise whatever function was
 * passed in will be used to log debug messages.
 */
exports.debug = function() {
  if (!this.options.debug) {
    return this.options.debug = function() {};
  }
  if (_.isBoolean(this.options.debug)) {
    this.options.debug = console.log;
  }
  if (!_.isFunction(this.options.debug)) {
    throw new Error('Unable to use debug option as it has not been initialized with a logger or boolean');
  }
};
