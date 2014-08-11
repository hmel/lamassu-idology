'use strict';

var url = require('url');
var Nipple = require('nipple');
var FakeToe = require('faketoe');
var Qs = require('qs');

var FIELDS = [
  'username', 'password', 'invoice', 'amount', 'shipping', 'tax',
  'total', 'idType', 'idIssuer', 'idNumber', 'paymentMethod', 'firstName',
  'lastName', 'address', 'city', 'state', 'zip', 'ssnLast4', 'ssn', 'dobMonth',
  'dobDay', 'dobYear', 'ipAddress', 'sku', 'uid'
];

var IdologyApi = function(config) {
  this.config = config;
  this.uri = url.format({
    protocol: 'https',
    host: this.config.host,
    pathname: this.config.path
  });
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
  // TODO retry on network failure
  var data = normalizeData(rawData);

  for (var i = 0; i < FIELDS.length; i++) {
    var field = FIELDS[i];
    fields[field] = fields[field] || data[field];
  }

  _request(this.uri, fields, function (err, res) {
    if (err) return cb(err);
    if (res.response.error) {
      return cb(new Error(res.response.error.toString()));
    }

    var idPassed = res.response['summary-result'].key === 'id.success';
    var idResult = {success: idPassed};
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

function _request(uri, data, cb) {
  var fields = Qs.stringify(data);
  var options = {
    timeout: 20000,
    rejectUnauthorized: true,
    payload: fields,
    headers: {'content-type': 'application/x-www-form-urlencoded'}
  };

  Nipple.post(uri, options, function(err, res, payload) {
    if (err) return cb(err);
    var parser = FakeToe.createParser(function (err, obj) {
      cb(err, obj);
    });
    Nipple.toReadableStream(payload).pipe(parser);
  });
}
