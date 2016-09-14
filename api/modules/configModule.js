'use strict';

var colors = require('colors/safe');
var fs = require('fs');

var configPath="data/settings.json";

if (!fs.existsSync("data")){
  fs.mkdirSync("data");
}
var config = module.exports = {
  config: {
    cpu:{
      enabled: null,
      btcAddress: null,
      proxy: null,
      binPath: null,
      autostart:null,
      region: null,
      benchTime: null,
      cores: null,
      writeMinerLog: null
    },
    gpu:{
      enabled:null,
      btcAddress: null,
      proxy: null,
      binPath: null,
      autostart:null,
      region: null,
      benchTime: null,
      writeMinerLog: null
    },
    rigName: null,
    regions: null,
    benchmarks: null,
    profitabilityServiceUrl: null
  },
  algos: {
    lyra2re: {cpu:true,gpu:true},
    hodl: {cpu:true,gpu:false},
    cryptonight: {cpu:true,gpu:false},
    argon2: {cpu:true,gpu:false},
    yescrypt: {cpu:true,gpu:false},
    lbry:{cpu:false,gpu:true},
    blake2s:{cpu:false,gpu:true},
    lyra2rev2:{cpu:false,gpu:true},
    "myr-gr":{cpu:false,gpu:true},
    neoscrypt:{cpu:false,gpu:true},
    skein:{cpu:false,gpu:true},
    x17:{cpu:false,gpu:true}
  },
  getConfig: function () {
    return config.config;
  },
  setConfig: function (newConfig) {
    config.config = newConfig;
  },
  saveConfig: function () {
    console.log(colors.grey("writing config to file.."));
    fs.writeFile(configPath, JSON.stringify(config.config,null,2), function (err) {
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
            else{
              if (config.config.benchmarks[key].cpu!==undefined)
                config.config.benchmarks[key].cpu.benchRunning=false;
              if (config.config.benchmarks[key].gpu!==undefined)
                config.config.benchmarks[key].gpu.benchRunning=false;
            }
          });
          if (Object.keys(config.algos).length!==Object.keys(config.config.benchmarks).length){
            Object.keys(config.algos).forEach(function (key) {
              if(!(config.config.benchmarks.hasOwnProperty(key))){
                var newAlgo = {};
                if (config.algos[key].cpu){
                  newAlgo.cpu={};
                  newAlgo.cpu.enabled=true;
                  newAlgo.cpu.hashrate=null;
                  newAlgo.cpu.binPath=null;
                  newAlgo.cpu.cores=null;
                  newAlgo.cpu.benchRunning=false;
                }

                if (config.algos[key].gpu){
                  newAlgo.gpu={};
                  newAlgo.gpu.enabled=true;
                  newAlgo.gpu.hashrate=null;
                  newAlgo.gpu.binPath=null;
                  newAlgo.gpu.benchRunning=false;
                  newAlgo.gpu.extraParam=null;
                  newAlgo.gpu.passwordParam=null;
                }

                config.config.benchmarks[key]=newAlgo;
              }
            });
          }else{
            Object.keys(config.config.benchmarks).forEach(function (key) {
              if(config.config.benchmarks[key].cpu===undefined && config.algos[key].cpu){
                config.config.benchmarks[key].cpu={};
                config.config.benchmarks[key].cpu.enabled=true;
                config.config.benchmarks[key].cpu.hashrate=null;
                config.config.benchmarks[key].cpu.binPath=null;
                config.config.benchmarks[key].cpu.cores=null;
                config.config.benchmarks[key].cpu.benchRunning=false;
              }
              if(config.config.benchmarks[key].gpu===undefined && config.algos[key].gpu){
                config.config.benchmarks[key].gpu={};
                config.config.benchmarks[key].gpu.enabled=true;
                config.config.benchmarks[key].gpu.hashrate=null;
                config.config.benchmarks[key].gpu.binPath=null;
                config.config.benchmarks[key].gpu.benchRunning=false;
                config.config.benchmarks[key].gpu.extraParam=false;
                config.config.benchmarks[key].gpu.passwordParam=false;
              }
            });
          }
        });
      } else if (err.code == 'ENOENT') {
        //default conf
        config.config.cpu.enabled=true;
        config.config.gpu.enabled=false;
        config.config.regions = [{id: 0, name: "EU"}, {id: 1, name: "USA"}, {id: 2, name: "Hong Kong"}, {id: 3, name: "Japan"}];
        var isWin = /^win/.test(process.platform);
        if (isWin){
          config.config.cpu.binPath = "bin\\cpuminer.exe";
          config.config.gpu.binPath = "bin\\ccminer.exe";
        }else{
          config.config.cpu.binPath = "bin/cpuminer";
          config.config.gpu.binPath = "bin/ccminer";
        }
        config.config.cpu.autostart=false;
        config.config.gpu.autostart=false;
        config.config.benchmarks = {
        };
        config.config.cpu.benchTime=120;
        config.config.gpu.benchTime=120;
        config.config.rigName='RXX';
        config.config.cpu.writeMinerLog=true;
        config.config.gpu.writeMinerLog=true;
        config.saveConfig();
        config.loadConfig();
      }
    });
  }
};
console.log("initializing, please wait...");
config.loadConfig();
