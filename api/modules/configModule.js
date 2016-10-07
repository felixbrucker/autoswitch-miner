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
    nvidia:{
      enabled:null,
      btcAddress: null,
      proxy: null,
      binPath: null,
      autostart:null,
      region: null,
      benchTime: null,
      writeMinerLog: null
    },
    custom:{
      enabled:null,
      autostart:null,
      entries:[]
    },
    rigName: null,
    regions: null,
    benchmarks: null,
    profitabilityServiceUrl: null,
    types:null
  },
  algos: {
    lyra2re: {cpu:true,nvidia:true},
    hodl: {cpu:true,nvidia:false},
    cryptonight: {cpu:true,nvidia:false},
    argon2: {cpu:true,nvidia:false},
    yescrypt: {cpu:true,nvidia:false},
    lbry:{cpu:false,nvidia:true},
    blake2s:{cpu:false,nvidia:true},
    lyra2rev2:{cpu:false,nvidia:true},
    "myr-gr":{cpu:false,nvidia:true},
    neoscrypt:{cpu:false,nvidia:true},
    skein:{cpu:false,nvidia:true},
    x17:{cpu:false,nvidia:true}
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
              if (config.config.benchmarks[key].nvidia!==undefined)
                config.config.benchmarks[key].nvidia.benchRunning=false;
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

                if (config.algos[key].nvidia){
                  newAlgo.nvidia={};
                  newAlgo.nvidia.enabled=true;
                  newAlgo.nvidia.hashrate=null;
                  newAlgo.nvidia.binPath=null;
                  newAlgo.nvidia.benchRunning=false;
                  newAlgo.nvidia.extraParam=null;
                  newAlgo.nvidia.passwordParam=null;
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
              if(config.config.benchmarks[key].nvidia===undefined && config.algos[key].nvidia){
                config.config.benchmarks[key].nvidia={};
                config.config.benchmarks[key].nvidia.enabled=true;
                config.config.benchmarks[key].nvidia.hashrate=null;
                config.config.benchmarks[key].nvidia.binPath=null;
                config.config.benchmarks[key].nvidia.benchRunning=false;
                config.config.benchmarks[key].nvidia.extraParam=null;
                config.config.benchmarks[key].nvidia.passwordParam=null;
              }
            });
          }
        });
      } else if (err.code == 'ENOENT') {
        //default conf
        config.config.cpu.enabled=true;
        config.config.nvidia.enabled=false;
        config.config.custom.enabled=false;
        config.config.regions = [{id: 0, name: "EU"}, {id: 1, name: "USA"}, {id: 2, name: "Hong Kong"}, {id: 3, name: "Japan"}];
        var isWin = /^win/.test(process.platform);
        if (isWin){
          config.config.cpu.binPath = "bin\\cpuminer.exe";
          config.config.nvidia.binPath = "bin\\ccminer.exe";
        }else{
          config.config.cpu.binPath = "bin/cpuminer";
          config.config.nvidia.binPath = "bin/ccminer";
        }
        config.config.cpu.autostart=false;
        config.config.nvidia.autostart=false;
        config.config.custom.autostart=false;
        config.config.benchmarks = {};
        config.config.cpu.benchTime=60;
        config.config.nvidia.benchTime=60;
        config.config.rigName='RXX';
        config.config.cpu.writeMinerLog=false;
        config.config.nvidia.writeMinerLog=false;
        config.saveConfig();
        config.loadConfig();
      }
    });
  }
};
console.log("initializing, please wait...");
config.loadConfig();
