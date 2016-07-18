'use strict';

const https = require('https');
const http = require('http');
const wait = require('wait.for');
var fs = require('fs');

var configModule = require(__basedir + 'api/modules/configModule');
var miner_log = fs.createWriteStream(__basedir + '/miner.log', {flags: 'w'});

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

var cpuminer = null;
var bestAlgo = null;


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

function startMiner() {
  if (cpuminer == null) {
    stats.btcAddress = configModule.config.btcAddress;
    var url = "stratum+tcp://";
    if (configModule.algos[bestAlgo].dn)
      url += configModule.algos[bestAlgo].dn
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
    const spawn = require('child_process').spawn;
    cpuminer = spawn(configModule.config.binPath, ['-a', bestAlgo, '-o', url, '-u', configModule.config.btcAddress, '-p', 'x']);
    cpuminer.stdout.on('data', function (data) {
      miner_log.write(data.toString());
    });

    cpuminer.stderr.on('data', function (data) {
      miner_log.write(data.toString());
    });
  } else {
    console.log("miner already running, not starting");
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
  if (cpuminer!==null){
    kill(cpuminer.pid);
    cpuminer = null;
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
      for (; i < 12; i++) {
        wait.for(asyncSleep, 15000);
        if (stats.hashrate !== null && stats.hashrate !== 0) {
          hashrate += stats.hashrate;
        } else {
          i--;
        }
        console.log("hashrate: " + stats.hashrate + " KH/s");
      }
      configModule.config.benchmarks[key].benchRunning = false;
      stopMiner();
      configModule.config.benchmarks[key].hashrate = (hashrate) / i;
      console.log("avg hashrate: " + configModule.config.benchmarks[key].hashrate + " KH/s");
    }
  });
  stats.benchRunning = false;
  bestAlgo = currentBest;
}

function getProfitability() {
  https.get({
    host: 'www.nicehash.com',
    path: '/api?method=stats.global.current&location=' + configModule.config.region
  }, function (response) {
    var body = '';
    response.on('data', function (d) {
      body += d;
    });
    response.on('end', function () {
      var parsed = JSON.parse(body);
      setRealProfitability("scrypt", parseFloat(parsed.result.stats['0'].price));
      setRealProfitability("sha256d", parseFloat(parsed.result.stats['1'].price));
      setRealProfitability("scryptnf", parseFloat(parsed.result.stats['2'].price));
      setRealProfitability("x11", parseFloat(parsed.result.stats['3'].price));
      setRealProfitability("x13", parseFloat(parsed.result.stats['4'].price));
      setRealProfitability("keccak", parseFloat(parsed.result.stats['5'].price));
      setRealProfitability("x15", parseFloat(parsed.result.stats['6'].price));
      setRealProfitability("nist5", parseFloat(parsed.result.stats['7'].price));
      setRealProfitability("neoscrypt", parseFloat(parsed.result.stats['8'].price));
      setRealProfitability("lyra2re", parseFloat(parsed.result.stats['9'].price));
      setRealProfitability("whirlpoolx", parseFloat(parsed.result.stats['10'].price));
      setRealProfitability("qubit", parseFloat(parsed.result.stats['11'].price));
      setRealProfitability("quark", parseFloat(parsed.result.stats['12'].price));
      setRealProfitability("axiom", parseFloat(parsed.result.stats['13'].price));
      setRealProfitability("lyra2rev2", parseFloat(parsed.result.stats['14'].price));
      setRealProfitability("scryptjane", parseFloat(parsed.result.stats['15'].price));
      setRealProfitability("blake2s", parseFloat(parsed.result.stats['16'].price));
      setRealProfitability("blake256r14", parseFloat(parsed.result.stats['17'].price));
      setRealProfitability("blake256r8vnl", parseFloat(parsed.result.stats['18'].price));
      setRealProfitability("hodl", parseFloat(parsed.result.stats['19'].price));
      setRealProfitability("daggerhashimoto", parseFloat(parsed.result.stats['20'].price));
      setRealProfitability("decred", parseFloat(parsed.result.stats['21'].price));
      changeAlgo();
    });
  });
}
function getMinerStats() {
  var WebSocketClient = require('websocket').client;
  var client = new WebSocketClient();

  client.on('connectFailed', function (error) {
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
  client.connect('ws://127.0.0.1:4048/summary', 'text');
}

function changeAlgo() {
  if (stats.benchRunning === false) {
    var currentProf = 0;
    if (bestAlgo !== null && configModule.config.benchmarks[bestAlgo].enabled) {
      currentProf = configModule.algos[bestAlgo].profitability * configModule.config.benchmarks[bestAlgo].hashrate;
    } else {
      bestAlgo = "lyra2rev2";
    }
    var potentialBestProf = 0;
    var potentialAlgo = null;
    Object.keys(configModule.algos).forEach(function (key) {
      if (configModule.config.benchmarks[key].enabled && configModule.algos[key].profitability * configModule.config.benchmarks[key].hashrate > potentialBestProf) {
        potentialBestProf = configModule.algos[key].profitability * configModule.config.benchmarks[key].hashrate;
        potentialAlgo = key;
      }
    });
    if (potentialBestProf > currentProf) {
      bestAlgo = potentialAlgo;
      if (stats.running) {
        stopMiner();
        startMiner();
      }
    }
  }
}

function setRealProfitability(key, price) {
  switch (configModule.algos[key].unit) {
    case 0:
      configModule.algos[key].profitability = price;
      break;
    case 1:
      configModule.algos[key].profitability = price / 1024;
      break;
    case 2:
      configModule.algos[key].profitability = price / (1024 * 1024);
      break;
    case 3:
      configModule.algos[key].profitability = price / (1024 * 1024 * 1024);
      break;
    case 4:
      configModule.algos[key].profitability = price / (1024 * 1024 * 1024 * 1024);
      break;
    case 5:
      configModule.algos[key].profitability = price / (1024 * 1024 * 1024 * 1024 * 1024);
      break;
    default:
      configModule.algos[key].profitability = null;
      break;
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

  var minutes = 5, profitabilityInterval = minutes * 60 * 1000;
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

