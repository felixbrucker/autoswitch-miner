'use strict';

const https = require('https');
const http = require('http');
const wait = require('wait.for');
var fs = require('fs');
var colors = require('colors/safe');

var configModule = require(__basedir + 'api/modules/configModule');
var miner_log = fs.createWriteStream('data/miner.log', {flags: 'w'});

var stats = {
  running: null,
  hashrate: null,
  algorithm: null,
  cores: null,
  miner: null,
  accepted: null,
  rejected: null,
  acceptedPerMinute: null,
  difficulty: null,
  uptime: null,
  temperature: null,
  profitability: null,
  btcAddress: configModule.config.btcAddress,
  benchRunning: false
};

global.cpuminer = null;
var bestAlgo = null;
var justStarted = null;


function getStats(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(stats));
}

function startMining(req, res, next) {
  if (!stats.running) {
    startMiner();
  }
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({success: true}));
}

function validateSettings() {
  if (configModule.config.btcAddress !== null && configModule.config.region !== null && configModule.config.binPath !== null && configModule.config.rigName !== null && configModule.config.rigName !== '') {
    try {
      fs.statSync(configModule.config.binPath);
    } catch (err) {
      return !(err && err.code === 'ENOENT');
    }
    Object.keys(configModule.config.benchmarks).forEach(function (key) {
      if(configModule.config.benchmarks[key].binPath!==undefined && configModule.config.benchmarks[key].binPath!==null && configModule.config.benchmarks[key].binPath!=="") {
        try {
          fs.statSync(configModule.config.benchmarks[key].binPath);
        } catch (err) {
          return !(err && err.code === 'ENOENT');
        }
      }
    });
    return true;
  }
  else
    return false;
}

function startMiner() {
  if (validateSettings()) {
    if (cpuminer == null) {
      changeAlgo();
      if (bestAlgo!==null && bestAlgo!==""){
        var binPath = configModule.config.binPath;
        var cores = configModule.config.cores;
        if (configModule.config.benchmarks[bestAlgo].cores!==undefined && configModule.config.benchmarks[bestAlgo].cores!==null && configModule.config.benchmarks[bestAlgo].cores!=="")
          cores=configModule.config.benchmarks[bestAlgo].cores;
        if (configModule.config.benchmarks[bestAlgo].binPath!==undefined && configModule.config.benchmarks[bestAlgo].binPath!==null && configModule.config.benchmarks[bestAlgo].binPath!=="")
          binPath=configModule.config.benchmarks[bestAlgo].binPath;
        if (stats.benchRunning === true) {
          var algo = bestAlgo;
          if (configModule.algos[bestAlgo].alt)
            algo = configModule.algos[bestAlgo].alt;
          const spawn = require('cross-spawn');
          if (cores !== null && cores !== "")
            cpuminer = spawn(binPath, ['-b','127.0.0.1:4096','-a', algo, '-t',cores,'--benchmark']);
          else
            cpuminer = spawn(binPath, ['-b','127.0.0.1:4096','-a', algo, '--benchmark']);
          justStarted=1;
          setTimeout(function (){
            justStarted=null;
          },5000);
          console.log(colors.green("benchmark miner started, using "+algo));
          if (configModule.config.writeMinerLog) {
            cpuminer.stdout.on('data', function (data) {
              miner_log.write(data.toString());
            });
            cpuminer.stderr.on('data', function (data) {
              miner_log.write(data.toString());
            });
          }
        } else {
          if (bestAlgo !== null && bestAlgo !== "") {
            stats.btcAddress = configModule.config.btcAddress;
            var algo = bestAlgo;
            if (configModule.algos[bestAlgo].alt)
              algo = configModule.algos[bestAlgo].alt;
            var url = "stratum+tcp://";
            if (configModule.algos[bestAlgo].dn)
              url += configModule.algos[bestAlgo].dn;
            else
              url += bestAlgo;
            url += ".";
            switch (configModule.config.region) {
              case 0:
                url += "eu";
                break;
              case 1:
                url += "usa";
                break;
              default:
                url += "eu";
                break;
            }
            url += ".nicehash.com:" + configModule.algos[bestAlgo].port;

            const spawn = require('cross-spawn');
            if (configModule.config.cores !== undefined && configModule.config.cores !== null && configModule.config.cores !== "") {
              if (configModule.config.proxy !== null && configModule.config.proxy !== "") {
                cpuminer = spawn(binPath, ['-b','127.0.0.1:4096','-a', algo, '-t', cores, '-x', configModule.config.proxy, '-o', url, '-u', configModule.config.btcAddress + '.' + configModule.config.rigName, '-p', 'x']);
              } else {
                cpuminer = spawn(binPath, ['-b','127.0.0.1:4096','-a', algo, '-t', cores, '-o', url, '-u', configModule.config.btcAddress + '.' + configModule.config.rigName, '-p', 'x']);
              }
            } else {
              if (configModule.config.proxy !== null && configModule.config.proxy !== "") {
                cpuminer = spawn(binPath, ['-b','127.0.0.1:4096','-a', algo, '-x', configModule.config.proxy, '-o', url, '-u', configModule.config.btcAddress + '.' + configModule.config.rigName, '-p', 'x']);
              } else {
                cpuminer = spawn(binPath, ['-b','127.0.0.1:4096','-a', algo, '-o', url, '-u', configModule.config.btcAddress + '.' + configModule.config.rigName, '-p', 'x']);
              }
            }
            justStarted=1;
            setTimeout(function (){
              justStarted=null;
            },5000);
            console.log(colors.green("miner started, using "+algo));

            cpuminer.stdout.on('data', function (data) {
              if (data.toString().search("accepted") !== -1 || data.toString().search("rejected") !== -1){
                console.log(data.toString().trim().slice(30));
              }
              if (configModule.config.writeMinerLog) {
                miner_log.write(data.toString());
              }
            });

            cpuminer.stderr.on('data', function (data) {
              if (configModule.config.writeMinerLog) {
                miner_log.write(data.toString());
              }
            });

          } else {
            console.log(colors.red("no benchmark values avilable, please insert at least one value or run benchmark"));
          }
        }
      }else{
        console.log(colors.red("no profitability data available"));
      }
    } else {
      console.log(colors.red("miner already running, not starting"));
    }
  } else {
    console.log(colors.red("some required settings are not properly configured"));
  }
}

function stopMining(req, res, next) {
  if (stats.running) {
    stopMiner();
  }
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({success: true}));
}

function stopMiner() {
  var psTree = require('ps-tree');

  var kill = function (pid, signal, callback) {
    signal = signal || 'SIGKILL';
    callback = callback || function () {
      };
    var killTree = true;
    if (killTree) {
      psTree(pid, function (err, children) {
        [pid].concat(
          children.map(function (p) {
            return p.PID;
          })
        ).forEach(function (tpid) {
          try {
            process.kill(tpid, signal)
          }
          catch (ex) {
          }
        });
        callback();
      });
    } else {
      try {
        process.kill(pid, signal)
      }
      catch (ex) {
      }
      callback();
    }
  };
  if (cpuminer !== null) {
    kill(cpuminer.pid);
    cpuminer = null;
    console.log(colors.green("miner stopped"));
  }
}

function doBenchmarkWrapper(req, res, next) {
  if (stats.benchRunning === false) {
    wait.launchFiber(doBenchmark);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({success: true}));
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({success: false}));
  }
}

function asyncSleep(param, callback) {
  setTimeout(function () {
    callback(null);
  }, param);
}

function doBenchmark() {
  stats.benchRunning = true;
  if (cpuminer !== null) {
    wait.for(stopMiner);
  }
  var currentBest = bestAlgo;
  Object.keys(configModule.config.benchmarks).forEach(function (key) {
    if (configModule.config.benchmarks[key].enabled) {
      bestAlgo = key;
      configModule.config.benchmarks[key].benchRunning = true;
      console.log("benchmarking: " + key + " ..");
      startMiner();
      var i = 0;
      var hashrate = 0;
      while (stats.hashrate === null || stats.hashrate === 0) {
        wait.for(asyncSleep, 1000);
      }
      wait.for(asyncSleep, 10000);
      for (; i < configModule.config.benchTime && cpuminer !== null; i++) {
        wait.for(asyncSleep, 1000);
        hashrate += stats.hashrate;
      }
      configModule.config.benchmarks[key].benchRunning = false;
      stopMiner();
      configModule.config.benchmarks[key].hashrate = (hashrate) / i;
      console.log(colors.green("avg hashrate: " + configModule.config.benchmarks[key].hashrate.toFixed(6) + " KH/s"));
      configModule.saveConfig();
    }
  });
  stats.benchRunning = false;
  bestAlgo = currentBest;
}

function getProfitability() {
  return https.get({
    host: 'www.nicehash.com',
    path: '/api?method=simplemultialgo.info'
  }, function (response) {
    var body = '';
    response.on('data', function (d) {
      body += d;
    });
    response.on('end', function () {
      var parsed = null;
      try{
        parsed=JSON.parse(body);
      }catch(error){
        console.log("Error: Unable to get profitability data");
        console.log(error);
      }
      if (parsed != null){
        setRealProfitability("lyra2re",parseFloat(parsed.result.simplemultialgo['9'].paying));
        setRealProfitability("axiom",parseFloat(parsed.result.simplemultialgo['13'].paying));
        setRealProfitability("scryptjane",parseFloat(parsed.result.simplemultialgo['15'].paying));
        setRealProfitability("hodl",parseFloat(parsed.result.simplemultialgo['19'].paying));
        setRealProfitability("cryptonight",parseFloat(parsed.result.simplemultialgo['22'].paying));
        changeAlgo();
      }
    });
  }).on("error", function(error) {
    console.log("Error: Unable to get profitability data");
    console.log(error);
  });
}

function setRealProfitability(key,profitability){
  switch(configModule.algos[key].profUnit){
    case 0: configModule.algos[key].profitability=profitability;
      break;
    case 1: configModule.algos[key].profitability=profitability/1000;
      break;
    case 2: configModule.algos[key].profitability=profitability/1000000;
      break;
    case 3: configModule.algos[key].profitability=profitability/1000000000;
      break;
    case 4: configModule.algos[key].profitability=profitability/1000000000000;
      break;
    case 5: configModule.algos[key].profitability=profitability/1000000000000000;
      break;
  }
}

function getMinerStats() {
  var WebSocketClient = require('websocket').client;
  var client = new WebSocketClient();

  client.on('connectFailed', function (error) {
    if (cpuminer!==null&&justStarted===null){
      stopMiner();
      startMiner();
    }else
      stats.running = false;
  });

  client.on('connect', function (connection) {
    connection.on('error', function (error) {
      console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function () {
    });
    connection.on('message', function (message) {
      if (message.type === 'utf8') {
        var properties = message.utf8Data.split(';');
        var obj = {};
        properties.forEach(function (property) {
          var tup = property.split('=');
          obj[tup[0]] = tup[1];
        });
        stats.running = true;
        stats.accepted = parseFloat(obj.ACC);
        stats.acceptedPerMinute = parseFloat(obj.ACCMN);
        stats.algorithm = obj.ALGO;
        stats.cores = parseFloat(obj.CPUS);
        stats.difficulty = parseFloat(obj.DIFF);
        stats.hashrate = parseFloat(obj.KHS);
        stats.miner = obj.NAME + " " + obj.VER;
        stats.rejected = parseFloat(obj.REJ);
        stats.temperature = parseFloat(obj.TEMP);
        stats.uptime = obj.UPTIME;
        stats.profitability = stats.hashrate * configModule.algos[stats.algorithm].profitability;
      }
    });
  });
  client.connect('ws://127.0.0.1:4096/summary', 'text');
}

function changeAlgo() {
  if (stats.benchRunning === false) {
    var currentProf = 0;
    if (bestAlgo !== null && bestAlgo !== "" && configModule.config.benchmarks[bestAlgo].enabled) {
      currentProf = configModule.algos[bestAlgo].profitability * configModule.config.benchmarks[bestAlgo].hashrate;
    } else {
      bestAlgo = "";
    }
    var potentialBestProf = 0;
    var potentialAlgo = null;
    Object.keys(configModule.algos).forEach(function (key) {
      if (configModule.config.benchmarks[key].enabled && configModule.algos[key].profitability * configModule.config.benchmarks[key].hashrate > potentialBestProf) {
        potentialBestProf = configModule.algos[key].profitability * configModule.config.benchmarks[key].hashrate;
        potentialAlgo = key;
      }
    });
    if (potentialBestProf > currentProf && bestAlgo!==potentialAlgo) {
      if (stats.running) {
        console.log("changing algo: " + bestAlgo + " => " + potentialAlgo);
        stopMiner();
        bestAlgo = potentialAlgo;
        startMiner();
      }else
        bestAlgo = potentialAlgo;
    }
  }
}

function checkBenchmark(req, res, next) {
  if (stats.benchRunning) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({running: true}));
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({running: false}));
  }
}

function init() {
  getProfitability();
  getMinerStats();
  if (configModule.config.autostart) {
    console.log("autostart enabled, starting miner shortly..");
    setTimeout(function () {
      startMiner();
    }, 10000);
  }

  var minutes = 3, profitabilityInterval = minutes * 60 * 1000;
  setInterval(function () {
    getProfitability();
  }, profitabilityInterval);
  setInterval(function () {
    getMinerStats();
  }, 2000);
}

setTimeout(init, 1000);

exports.getStats = getStats;
exports.startMining = startMining;
exports.stopMining = stopMining;
exports.doBenchmarkWrapper = doBenchmarkWrapper;
exports.checkBenchmark = checkBenchmark;
exports.stopMiner = stopMiner;
exports.startMiner = startMiner;