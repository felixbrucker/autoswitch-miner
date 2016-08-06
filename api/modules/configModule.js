'use strict';

var colors = require('colors/safe');
var fs = require('fs');

var configPath="data/settings.json";

if (!fs.existsSync("data")){
  fs.mkdirSync("data");
}
var config = module.exports = {
  config: {
    region: null,
    regions: null,
    btcAddress: null,
    proxy: null,
    binPath: null,
    autostart:null,
    benchmarks: null,
    benchTime: null,
    rigName: null
  },
  algos: {
    lyra2re: {id: 9, name: "Lyra2RE", port: 3342, profitability: null, unit: 2},
    axiom: {id: 13, name: "Axiom", port: 3346, profitability: null, unit: 0},
    scryptjane: {id: 15, name: "ScryptJaneNf16", dn: "scryptjanenf16", port: 3348, profitability: null, unit: 1},
    hodl: {id: 19, name: "Hodl", port: 3352, profitability: null, unit: 2}
  },
  getConfig: function () {
    return config.config;
  },
  setConfig: function (newConfig) {
    config.config = newConfig;
  },
  saveConfig: function () {
    console.log(colors.grey("writing config to file.."));
    fs.writeFile(configPath, JSON.stringify(config.config), function (err) {
      if (err) {
        return console.log(err);
      }
    });
  },
  loadConfig: function () {
    fs.stat(configPath, function (err, stat) {
      if (err == null) {
        fs.readFile(configPath, 'utf8', function (err, data) {
          if (err) throw err;
          config.config = JSON.parse(data);
          Object.keys(config.config.benchmarks).forEach(function (key) {
            config.config.benchmarks[key].benchRunning=false;
          });
        });
      } else if (err.code == 'ENOENT') {
        //default conf
        var isWin = /^win/.test(process.platform);
        config.config.regions = [{id: 0, name: "Nicehash EU"}, {id: 1, name: "Nicehash USA"}];
        if (isWin)
          config.config.binPath = "bin\\cpuminer.exe";
        else
          config.config.binPath = "bin/cpuminer";
        config.config.autostart=false;
        config.config.benchmarks = {
          lyra2re: {name: "Lyra2RE", hashrate: null, enabled: true, benchRunning:null},
          axiom: {name: "Axiom", hashrate: null, enabled: true, benchRunning:null},
          scryptjane: {name: "ScryptJaneNf16", hashrate: null, enabled: true, benchRunning:null},
          hodl: {name: "Hodl", hashrate: null, enabled: true, benchRunning:null}
        };
        config.config.benchTime=60;
        config.config.rigName='RXX';
        config.saveConfig();
      }
    });
  }
};
console.log(colors.blue("initializing, please wait..."));
config.loadConfig();
