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
  emitter.on('nodeAdded', node => {
    exports.knownHosts.push(node.host);
    exports.knownHosts = _.uniq(exports.knowHost);
  });
  emitter.on('nodeRemoved', node => {
    exports.knownHosts = _.pull(exports.knownHosts, node.host);
  });
  exports.start();
};

/**
 * Writes the listening host of this instance to a file a start a file watcher.
 */
exports.start = function() {
  fs.readFile(exports.options.discovery.file, 'utf8', (err, data) => {
    if (err && err.code == 'ENOENT' || data.indexOf(exports.options.listen) == -1) {
      fs.appendFileSync(exports.options.discovery.file, exports.options.listen + '\n', 'utf8');
    } else {
      exports.options.debug('Not appending to shared file in local discovery because host was already added');
    }
    fs.watchFile(exports.options.discovery.file, {
      persistent: false,
      interval: exports.options.discovery.interval
    }, exports.watcher);
  });
};

/**
 * The watcher function that checks for new hosts.
 * @param {Stats} curr
 * @param {Stats} prev
 * @fires discovered
 */
exports.watcher = function(curr, prev) {
  if (curr.mtime == 0) {
    return this.emitter.emit(new Error('Local discovery can\'t find file to watch for:', exports.options.discovery.file));
  }
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

/**
 * Stops watching the local file for new hosts.
 */
exports.stop = function() {
  fs.unwatchFile(exports.options.discovery.file, exports.watcher);
  var content = fs.readFileSync(exports.options.discovery.file, 'utf8');
  content.replace(exports.options.listen + '\n', '');
  fs.writeFileSync(exports.options.discovery.file, content, 'utf8');
};
