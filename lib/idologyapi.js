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

// Callback returns cb(err, idPassed, usageError)
// Where idPassed indicates whether ID is okay,
// usageError is null if okay, or error string
// if over limit.
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
    var idPassed = res.response['summary-result'][0].key[0] === 'id.success';
    var velocityResults = res.response['velocity-results'];
    var velocityResult = velocityResults && velocityResults.length > 0 ? 
      velocityResults[0]['velocity-result'][0].message[0] :
      null;

    cb(err, idPassed, velocityResult);
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
