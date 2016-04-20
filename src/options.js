'use strict';

var _ = require('lodash');
var shortId = require('shortid');

/**
 * The default options object, that will be combined with any passed in options.
 */
exports.defaultOptions = {
  cluster: {
    name: 'zero'
  },
  handshake: 2205,
  listen: 2206,
  discovery: {
    type: 'multicast'
  },
  nodes: {
    maxPeers: Number.POSITIVE_INFINITY
  },
  debug: false
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
 * Checks that the cluster we're trying to connect to has a name.
 */
exports.cluster = function() {
  this.options.cluster.name = this.options.cluster.name.trim();
  if (!this.options.cluster.name.length) {
    throw new Error('No cluster name has been set');
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
 * Makes sure the connection string for direct connections is something zeromq can understand.
 */
exports.handshake = function() {
  if (_.isNumber(this.options.handshake)) {
    this.options.handshake = 'tcp://0.0.0.0:' + this.options.handshake;
  }
  if (!exports.isValidHost(this.options.handshake)) {
    throw new Error('Unable to connect with invalid host setting:' + this.options.handshake);
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
        if (elem.length == 0) {
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
      // TODO make sure that a port(-range) has been set that we want to check
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
