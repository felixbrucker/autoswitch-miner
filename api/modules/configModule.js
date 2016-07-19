'use strict';

var colors = require('colors/safe');

var config = module.exports = {
  config: {
    region: null,
    regions: null,
    btcAddress: null,
    proxy: null,
    binPath: null,
    autostart:null,
    benchmarks: null
  },
  algos: {
    scrypt: {id: 0, name: "Scrypt", port: 3333, profitability: null, unit: 2},
    sha256d: {id: 1, name: "SHA256", dn: "sha256", port: 3334, profitability: null, unit: 4},
    scryptnf: {id: 2, name: "ScryptNf", port: 3335, profitability: null, unit: 2},
    x11: {id: 3, name: "X11", port: 3336, profitability: null, unit: 2},
    x13: {id: 4, name: "X13", port: 3337, profitability: null, unit: 2},
    keccak: {id: 5, name: "Keccak", port: 3338, profitability: null, unit: 2},
    x15: {id: 6, name: "X15", port: 3339, profitability: null, unit: 2},
    nist5: {id: 7, name: "Nist5", port: 3340, profitability: null, unit: 2},
    neoscrypt: {id: 8, name: "NeoScrypt", port: 3341, profitability: null, unit: 2},
    lyra2re: {id: 9, name: "Lyra2RE", port: 3342, profitability: null, unit: 2},
    whirlpoolx: {id: 10, name: "WhirlpoolX", port: 3343, profitability: null, unit: 2},
    qubit: {id: 11, name: "Qubit", port: 3344, profitability: null, unit: 2},
    quark: {id: 12, name: "Quark", port: 3345, profitability: null, unit: 2},
    axiom: {id: 13, name: "Axiom", port: 3346, profitability: null, unit: 0},
    lyra2rev2: {id: 14, name: "Lyra2REv2", port: 3347, profitability: null, unit: 2},
    scryptjane: {id: 15, name: "ScryptJaneNf16", dn: "scryptjanenf16", port: 3348, profitability: null, unit: 1},
    blake256r8: {id: 16, name: "Blake256r8", alt:"blake2s", port: 3349, profitability: null, unit: 3},
    blake256r14: {id: 17, name: "Blake256r14", alt:"blake2s",port: 3350, profitability: null, unit: 3},
    blake256r8vnl: {id: 18, name: "Blake256r8vnl", alt:"blake2s",port: 3351, profitability: null, unit: 3},
    hodl: {id: 19, name: "Hodl", port: 3352, profitability: null, unit: 0},
    daggerhashimoto: {id: 20, name: "Daggerhashimoto", port: 3353, profitability: null, unit: 2},
    decred: {id: 21, name: "Decred", port: 3354, profitability: null, unit: 2}
  },
  getConfig: function () {
    return config.config;
  },
  setConfig: function (newConfig) {
    config.config = newConfig;
  },
  saveConfig: function () {
    console.log(colors.grey("writing config to file.."));
    var fs = require('fs');
    fs.writeFile("settings.json", JSON.stringify(config.config), function (err) {
      if (err) {
        return console.log(err);
      }
    });
  },
  loadConfig: function () {
    var fs = require('fs');
    fs.stat('settings.json', function (err, stat) {
      if (err == null) {
        fs.readFile('settings.json', 'utf8', function (err, data) {
          if (err) throw err;
          config.config = JSON.parse(data);
          Object.keys(config.config.benchmarks).forEach(function (key) {
            config.config.benchmarks[key].benchRunning=false;
          });
        });
      } else if (err.code == 'ENOENT') {
        //default conf
        config.config.regions = [{id: 0, name: "Nicehash EU"}, {id: 1, name: "Nicehash USA"}];
        config.config.binPath = __basedir + "bin/cpuminer";
        config.config.autostart=false;
        config.config.benchmarks = {
          scrypt: {name: "Scrypt", hashrate: null, enabled: true, benchRunning:null},
          sha256d: {name: "SHA256", hashrate: null, enabled: true, benchRunning:null},
          scryptnf: {name: "ScryptNf", hashrate: null, enabled: false},
          x11: {name: "X11", hashrate: null, enabled: true, benchRunning:null},
          x13: {name: "X13", hashrate: null, enabled: true, benchRunning:null},
          keccak: {name: "Keccak", hashrate: null, enabled: true, benchRunning:null},
          x15: {name: "X15", hashrate: null, enabled: true, benchRunning:null},
          nist5: {name: "Nist5", hashrate: null, enabled: true, benchRunning:null},
          neoscrypt: {name: "NeoScrypt", hashrate: null, enabled: true, benchRunning:null},
          lyra2re: {name: "Lyra2RE", hashrate: null, enabled: true, benchRunning:null},
          whirlpoolx: {name: "WhirlpoolX", hashrate: null, enabled: false},
          qubit: {name: "Qubit", hashrate: null, enabled: true, benchRunning:null},
          quark: {name: "Quark", hashrate: null, enabled: true, benchRunning:null},
          axiom: {name: "Axiom", hashrate: null, enabled: true, benchRunning:null},
          lyra2rev2: {name: "Lyra2REv2", hashrate: null, enabled: true, benchRunning:null},
          scryptjane: {name: "ScryptJaneNf16", hashrate: null, enabled: true, benchRunning:null},
          blake256r8: {name: "Blake256r8", hashrate: null, enabled: true, benchRunning:null},
          blake256r14: {name: "Blake256r14", hashrate: null, enabled: false},
          blake256r8vnl: {name: "Blake256r8vnl", hashrate: null, enabled: false},
          hodl: {name: "Hodl", hashrate: null, enabled: true, benchRunning:null},
          daggerhashimoto: {name: "Daggerhashimoto", hashrate: null, enabled: false},
          decred: {name: "Decred", hashrate: null, enabled: true, benchRunning:null}
        };
        config.saveConfig();
      }
    });
  }
};
console.log(colors.blue("initializing, please wait..."));
config.loadConfig();
