'use strict';

var _ = require('lodash');
var aws = require('aws-sdk');

/**
 * Connects to the AWS api to look up instances in your project.
 * @param {Options} options
 * @param {EventEmitter} emitter
 */
exports.discover = function(options, emitter) {
  var ec2options = {
    region: options.discovery.region,
    maxRetries: options.discovery.maxRetries,
    sslEnabled: options.discovery.sslEnabled == undefined ? true : options.discovery.sslEnabled
  };
  if (options.discovery.credentials) {
    Object.assign(ec2options, options.discovery.credentials);
  }
  var ec2 = new aws.EC2(ec2options);
  var requestParams = {
    Filters: options.discovery.filters,
    MaxResults: options.discovery.maxResults
  };
  ec2.describeInstances(requestParams, function (err, data) {
    if (err) {
      return emitter.emit('error', err);
    }
    var hosts = [];
    var port = options.discovery.port || options.listen.substr(options.listen.lastIndexOf(':') + 1);
    for (var reservation of data.Reservations) {
      for (var instance of reservation.Instances) {
        if (!_.isEmpty(instance.PublicDnsName)) {
          hosts.push('tcp://' + instance.PublicDnsName + ':' + port);
        } else if (!_.isEmpty(instance.PrivateDnsName)) {
          hosts.push('tcp://' + instance.PrivateDnsName + ':' + port);
        } else {
          options.debug('Ignoring instance as it has neither public nor private dns name:', instance);
        }
      }
    }
    emitter.emit('discovered', hosts);
  });
};
