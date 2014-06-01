'use strict';

var jsonquest = require('jsonquest');

var FIELDS = [
  'username', 'password', 'invoice', 'amount', 'shipping', 'tax',
  'total', 'idType', 'idIssuer', 'idNumber', 'paymentMethod', 'firstName', 'lastName', 
  'address', 'city', 'state', 'zip', 'ssnLast4', 'ssn', 'dobMonth', 'dobDay', 'dobYear', 
  'ipAddress', 'sku', 'uid'
];

var IdologyApi = function(config) {
  this.config = config;
};

IdologyApi.factory = function factory(config) {
  return new IdologyApi(config);
};

module.exports = IdologyApi;

IdologyApi.prototype.verify = function verify(data, cb) {
  var config = this.config;
  var fields = {
    username: config.username,
    password: config.password
  };

  // TODO check fields for length, etc
  // TODO retry on network failure (should go in jsonquest as option)

  // IDology wants all fields, even if blank
  for (var i = 0; i < FIELDS.length; i++) {
    var field = FIELDS[i];
    fields[field] = fields[field] || data[field] || '';
  }
  _request(this.config.host, this.config.path, fields, function (err, res) {
    if (err) return cb(err);
    var passed = res.response['summary-result'][0].key[0] === 'id.success';
    cb(err, passed);
  });
};

function _request(host, path, data, cb) {
  console.dir(data);
  var options = {
    host: host,
    path: path,
    responseType: 'xml',
    protocol: 'https',
    requestEncoding: 'queryString',
    method: 'POST',
    body: data,
    debug: true
  };
  jsonquest(options, function (err, res, body) {
    cb(err, body);
  });
}
