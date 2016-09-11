'use strict';

var colors = require('colors/safe');
var fs = require('fs');
var os = require('os');

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
    rigName: null,
    cores: null,
    writeMinerLog: null,
    useProfitabilityService: false,
    profitabilityServiceUrl: null
  },
  algos: {
    lyra2re: {id: 9, name: "Lyra2RE", port: 3342, profitability: null, submitUnit: 2, profUnit: 2},
    axiom: {id: 13, name: "Axiom", port: 3346, profitability: null, submitUnit: 1, profUnit: 0},
    scryptjanenf16: {id: 15, name: "ScryptJaneNf16", alt: "scryptjane", port: 3348, profitability: null, submitUnit: 1, profUnit: 1},
    hodl: {id: 19, name: "Hodl", port: 3352, profitability: null, submitUnit: 1, profUnit: 2},
    cryptonight: {id: 22, name: "CryptoNight", port:3355, profitability: null, submitUnit: 1, profUnit: 2},
    argon2: {id:-1, name:"argon2", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    blake2s: {id:-1, name:"blake2s", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    blake256r8: {id:-1, name:"blakecoin", alt:"blakecoin", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    c11: {id:-1, name:"c11", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    decred: {id:-1, name:"decred", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    lbry: {id:-1, name:"lbry", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    lyra2rev2: {id:-1, name:"lyra2rev2", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    m7m: {id:-1, name:"m7m", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    "myr-gr": {id:-1, name:"myr-gr", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    neoscrypt: {id:-1, name:"neoscrypt", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    nist5: {id:-1, name:"nist5", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    qubit: {id:-1, name:"qubit", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    quark: {id:-1, name:"quark", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    skein: {id:-1, name:"skein", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    veltor: {id:-1, name:"veltor", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    x11evo: {id:-1, name:"x11evo", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    x17: {id:-1, name:"x17", port:-1,profitability: null, submitUnit:-1,profUnit:-1},
    yescrypt: {id:-1, name:"yescrpyt", port:-1,profitability: null, submitUnit:-1,profUnit:-1}
  },
  cpuModel: os.cpus()[0].model.trim(),
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
            if (config.algos[key]===undefined)
              delete config.config.benchmarks[key];
            else
              config.config.benchmarks[key].benchRunning=false;
          });
          if (Object.keys(config.algos).length!==Object.keys(config.config.benchmarks).length){
            Object.keys(config.algos).forEach(function (key) {
              if(!(config.config.benchmarks.hasOwnProperty(key))){
                var newAlgo = {};
                newAlgo.name=config.algos[key].name;
                newAlgo.id=config.algos[key].id;
                newAlgo.submitUnit=config.algos[key].submitUnit;
                newAlgo.hashrate=null;
                if (newAlgo.id===-1)
                  newAlgo.enabled=false;
                else
                  newAlgo.enabled=true;
                newAlgo.benchRunning=null;
                newAlgo.binPath=null;
                newAlgo.cores=null;
                config.config.benchmarks[key]=newAlgo;
              }
            });
          }else{
            Object.keys(config.config.benchmarks).forEach(function (key) {
              if(config.config.benchmarks[key].id===undefined)
                config.config.benchmarks[key].id=config.algos[key].id;
              if(config.config.benchmarks[key].submitUnit===undefined)
                config.config.benchmarks[key].submitUnit=config.algos[key].submitUnit;
              if(config.config.benchmarks[key].cores===undefined)
                config.config.benchmarks[key].cores=null;
            });
          }
        });
      } else if (err.code == 'ENOENT') {
        //default conf
        config.config.regions = [{id: 0, name: "Nicehash EU"}, {id: 1, name: "Nicehash USA"}];
        var isWin = /^win/.test(process.platform);
        if (isWin)
          config.config.binPath = "bin\\cpuminer.exe";
        else
          config.config.binPath = "bin/cpuminer";
        config.config.autostart=false;
        config.config.benchmarks = {
        };
        config.config.benchTime=60;
        config.config.rigName='RXX';
        config.config.writeMinerLog=false;
        config.saveConfig();
        config.loadConfig();
      }
    });
  }
};
console.log("initializing, please wait...");
config.loadConfig();
