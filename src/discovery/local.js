'use strict';

var fs = require('fs');

var _ = require('lodash');

/**
 * The global {@link Options} object.
 * @type Options
 */
exports.options = null;

/**
 * The global emitter
 * @type {EventEmitter}
 */
exports.emitter = null;

/**
 * A list of all known hosts.
 * @type {string[]}
 */
exports.knownHosts = [];

/**
 * This method really doesn't do much other than return the list it was given.
 * @param {object} options
 * @param {EventEmitter} emitter
 */
exports.discover = function (options, emitter) {
  exports.options = options;
  exports.emitter = emitter;
  exports.knownHosts.push(exports.options.listen);
  emitter.on('connected', exports.stop);
  emitter.on('disconnected', exports.start);
  exports.start();
};

exports.start = function() {
  fs.readFile(exports.options.discovery.file, 'utf8', (err, data) => {
    if (err && err.code == 'ENOENT' || data.indexOf(exports.options.discovery.file) == -1) {
      fs.appendFileSync(exports.options.discovery.file + '\n', exports.options.listen, 'utf8');
    } else {
      exports.options.debug('Not appending to shared file in local discovery because host was already added');
    }
    fs.watchFile(exports.options.discovery.file, {
      persistent: false,
      interval: exports.options.discovery.interval
    }, exports.watcher);
  });
};

exports.watcher = function(curr, prev) {
  if (curr.mtime != prev.mtime) {
    fs.readFile(exports.options.discovery.file, 'utf8', (err, data) => {
      if (err) {
        return exports.emitter.emit('error');
      }
      var nodes = data.split(/\s/);
      nodes = _.filter(_.difference(nodes, exports.knownHosts), entry => entry.trim().length);
      if (nodes.length) {
        exports.knownHosts.concat(nodes);
        exports.emitter.emit('discovered', nodes);
      }
    });
  }
};

exports.stop = function() {
  fs.unwatchFile(exports.options.discovery.file, exports.watcher);
};
