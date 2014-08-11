'use strict';

var jsonquest = require('jsonquest');

var FIELDS = [
  'username', 'password', 'invoice', 'amount', 'shipping', 'tax',
  'total', 'idType', 'idIssuer', 'idNumber', 'paymentMethod', 'firstName',
  'lastName', 'address', 'city', 'state', 'zip', 'ssnLast4', 'ssn', 'dobMonth',
  'dobDay', 'dobYear', 'ipAddress', 'sku', 'uid'
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
IdologyApi.prototype.verify = function verify(rawData, cb) {
  var config = this.config;

  if (config.mock) {
    console.dir(normalizeData(rawData));
    return cb(null, {success: true});
  }

  var fields = {
    username: config.username,
    password: config.password
  };

  // TODO check fields for length, etc
  // TODO retry on network failure (should go in jsonquest as option)
  var data = normalizeData(rawData);

  for (var i = 0; i < FIELDS.length; i++) {
    var field = FIELDS[i];
    fields[field] = fields[field] || data[field];
  }
  _request(this.config.host, this.config.path, fields, function (err, res) {
    if (err) return cb(err);
    if (res.response.error) {
      return cb(new Error(res.response.error.join(', ')));
    }

    var idPassed = res.response['summary-result'][0].key[0] === 'id.success';
    var velocityResults = res.response['velocity-results'];
    var velocityResult = velocityResults && velocityResults.length > 0 ?
      velocityResults[0]['velocity-result'][0].message[0] :
      null;
    var idResult = {success: idPassed, failureMessage: velocityResult};
    cb(err, idResult);
  });
};

// Normalizes from Rakia standard
function normalizeData(rawData) {
  var dob = rawData.license.dateOfBirth; // Format is YYYMMDD

  // Pad with zeros
  var paddedCode = String('0000' + rawData.licenseCode).slice(-4);

  var data = {
    ssnLast4: paddedCode,
    zip: rawData.license.postalCode,
    dobYear: dob.substr(0, 4),
    dobMonth: dob.substr(4, 2),
    dobDay: dob.substr(6, 2)
  };

  for (var i = 0; i < FIELDS.length; i++) {
    var field = FIELDS[i];

    // IDology wants all fields, even if blank
    data[field] = data[field] || rawData.license[field] || '';
  }

  return data;
}

function _request(host, path, data, cb) {
  var options = {
    host: host,
    path: path,
    responseType: 'xml',
    protocol: 'https',
    requestEncoding: 'queryString',
    method: 'POST',
    body: data
  };
  jsonquest(options, function (err, res, body) {
    cb(err, body);
  });
}
