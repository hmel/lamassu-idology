'use strict';

var IDology = function(config) {
};

Bitcoind.factory = function factory(config) {
  return new IDology(config);
};

module.exports = IDology;
