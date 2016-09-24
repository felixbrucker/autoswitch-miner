'use strict';

const https = require('https');
const http = require('http');
const wait = require('wait.for');
var fs = require('fs');
var colors = require('colors/safe');
var psTree = require('ps-tree');
var rfs    = require('rotating-file-stream');
var cpu_miner_log = rfs('cpuminer.log', {
  size:     '50M',
  path:'data'
});
var nvidia_miner_log = rfs('nvidiaminer.log', {
  size:     '50M',
  path:'data'
});

cpu_miner_log.on('rotated', function(filename) {
  fs.unlinkSync(filename);
});
nvidia_miner_log.on('rotated', function(filename) {
  fs.unlinkSync(filename);
});

var configModule = require(__basedir + 'api/modules/configModule');

var stats = {
  cpu:{
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
    profitabilityPerKH: null,
    btcAddress: configModule.config.cpu.btcAddress,
    benchRunning: false,
    url:null
  },
  nvidia:{
    running: null,
    hashrate: null,
    algorithm: null,
    miner: null,
    gpus:null,
    accepted: null,
    rejected: null,
    acceptedPerMinute: null,
    difficulty: null,
    uptime: null,
    profitability: null,
    profitabilityPerKH: null,
    btcAddress: configModule.config.nvidia.btcAddress,
    benchRunning: false,
    url:null
  }

};

global.cpuminer = null;
global.nvidiaminer = null;
var bestAlgoCPU = null;
var bestAlgoNVIDIA = null;
var justStartedCPU = null;
var justStartedNVIDIA = null;


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

function getStats(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(stats));
}

function startMining(req, res, next) {
  if (req.body.type!==undefined&&(req.body.type==="cpu"||req.body.type==="nvidia")) {
    if (!stats[req.body.type].running) {
      startMinerWrapper(req.body.type);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({result: true}));
    }else{
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({result: false}));
    }
  }else{
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({result: false}));
  }
}

function validateSettings(type) {
  if (configModule.config[type].btcAddress !== null && configModule.config[type].region !== null && configModule.config[type].binPath !== null && configModule.config.rigName !== null && configModule.config.rigName !== '') {
    try {
      fs.statSync(configModule.config[type].binPath);
    } catch (err) {
      return !(err && err.code === 'ENOENT');
    }
    Object.keys(configModule.config.benchmarks).forEach(function (key) {
      if(configModule.config.benchmarks[key][type]!==undefined && configModule.config.benchmarks[key][type].binPath!==undefined && configModule.config.benchmarks[key][type].binPath!==null && configModule.config.benchmarks[key][type].binPath!=="") {
        try {
          fs.statSync(configModule.config.benchmarks[key][type].binPath);
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

function startMinerWrapper(type){
  getProfitability(type);
  setTimeout(function(){
    startMiner(type)
  },1000);
}

function startMiner(type) {
  if (validateSettings(type)) {
    var minerString="";
    var binPath="";
    if (type==="cpu"){
      if (configModule.config.cpu.enabled){
        if (cpuminer == null){
          if (bestAlgoCPU!==null && bestAlgoCPU!==""){

            binPath = configModule.config.cpu.binPath;
            var cores = configModule.config.cpu.cores;
            if (configModule.config.benchmarks[bestAlgoCPU].cpu.cores!==undefined && configModule.config.benchmarks[bestAlgoCPU].cpu.cores!==null && configModule.config.benchmarks[bestAlgoCPU].cpu.cores!=="")
              cores=configModule.config.benchmarks[bestAlgoCPU].cpu.cores;
            if (configModule.config.benchmarks[bestAlgoCPU].cpu.binPath!==undefined && configModule.config.benchmarks[bestAlgoCPU].cpu.binPath!==null && configModule.config.benchmarks[bestAlgoCPU].cpu.binPath!=="")
              binPath=configModule.config.benchmarks[bestAlgoCPU].cpu.binPath;

            if (stats.cpu.benchRunning) {
              //benchmark mode
              var algo = bestAlgoCPU;
              if (configModule.algos[bestAlgoCPU].alt)
                algo = configModule.algos[bestAlgoCPU].alt;
              if (cores !== null && cores !== "")
                minerString="-b 127.0.0.1:4096 -a "+algo+" -t "+cores+" --benchmark";
              else
                minerString="-b 127.0.0.1:4096 -a "+algo+" --benchmark";
              const spawn = require('cross-spawn');
              cpuminer = spawn(binPath, minerString.split(" "));
              justStartedCPU=1;
              setTimeout(function (){
                justStartedCPU=null;
              },5000);
              console.log(colors.green("[CPU] benchmark miner started, using "+algo));
              cpuminer.stdout.on('data', function (data) {
                if (configModule.config.cpu.writeMinerLog) {
                  cpu_miner_log.write(data.toString());
                }
              });

              cpuminer.stderr.on('data', function (data) {
                if (configModule.config.cpu.writeMinerLog)
                  cpu_miner_log.write(data.toString());
              });
            }else{
              //real mining
              stats.cpu.btcAddress = configModule.config.cpu.btcAddress;
              var algo = bestAlgoCPU;
              if (configModule.algos[bestAlgoCPU].alt)
                algo = configModule.algos[bestAlgoCPU].alt;
              if (cores !== null && cores !== "")
                minerString="-b 127.0.0.1:4096 -a "+algo+" -t "+cores;
              else
                minerString="-b 127.0.0.1:4096 -a "+algo;
              if (configModule.config.cpu.proxy!== null && configModule.config.cpu.proxy !== "")
                minerString+=" -x "+configModule.config.cpu.proxy;
              minerString+=" -o "+stats.cpu.url+" -u "+configModule.config.cpu.btcAddress+"."+configModule.config.rigName+" -p "+configModule.config.rigName;
              const spawn = require('cross-spawn');
              cpuminer = spawn(binPath, minerString.split(" "));
              justStartedCPU=1;
              setTimeout(function (){
                justStartedCPU=null;
              },5000);
              console.log(colors.magenta("[CPU] ")+colors.green("miner started, using "+algo));

              cpuminer.stdout.on('data', function (data) {
                if (data.toString().search("accepted") !== -1 || data.toString().search("rejected") !== -1)
                  console.log(colors.magenta("[CPU] ")+data.toString().trim().slice(30));
                if (configModule.config.cpu.writeMinerLog) {
                  cpu_miner_log.write(data.toString());
                }
              });

              cpuminer.stderr.on('data', function (data) {
                console.log(colors.magenta("[CPU] ")+data.toString().trim().slice(30));
                if (configModule.config.cpu.writeMinerLog)
                  cpu_miner_log.write(data.toString());
              });

            }
          }else{
            console.log(colors.magenta("[CPU] ")+colors.red("no profitibility data or algo available"));
            return false;
          }
        }else{
          console.log(colors.magenta("[CPU] ")+colors.red("miner already running"));
          return false;
        }
      }else{
        console.log(colors.magenta("[CPU] ")+colors.red("miner disabled"));
        return false;
      }
    }else{
      if (type==="nvidia"){
        if (configModule.config.nvidia.enabled){
          if (nvidiaminer == null){
            if (bestAlgoNVIDIA!==null && bestAlgoNVIDIA!==""){

              binPath = configModule.config.nvidia.binPath;
              if (configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.binPath!==undefined && configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.binPath!==null && configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.binPath!=="")
                binPath=configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.binPath;

              if (stats.nvidia.benchRunning) {
                var algo = bestAlgoNVIDIA;
                if (configModule.algos[bestAlgoNVIDIA].alt)
                  algo = configModule.algos[bestAlgoNVIDIA].alt;
                minerString="-b 127.0.0.1:4097 -a "+algo+" --benchmark";
                if (configModule.config.nvidia.extraParam!==undefined&&configModule.config.nvidia.extraParam!==null&&configModule.config.nvidia.extraParam!=="")
                  minerString+=" "+configModule.config.nvidia.extraParam;
                const spawn = require('cross-spawn');
                nvidiaminer = spawn(binPath, minerString.split(" "));
                justStartedNVIDIA=1;
                setTimeout(function (){
                  justStartedNVIDIA=null;
                },5000);
                console.log(colors.green("[NVIDIA] ")+colors.green("benchmark miner started, using "+algo));
                nvidiaminer.stdout.on('data', function (data) {
                  if (configModule.config.nvidia.writeMinerLog) {
                    nvidia_miner_log.write(data.toString());
                  }
                });

                nvidiaminer.stderr.on('data', function (data) {
                  if (configModule.config.nvidia.writeMinerLog)
                    nvidia_miner_log.write(data.toString());
                });
              }else{
                //real mining
                stats.nvidia.btcAddress = configModule.config.nvidia.btcAddress;
                var algo = bestAlgoNVIDIA;
                if (configModule.algos[bestAlgoNVIDIA].alt)
                  algo = configModule.algos[bestAlgoNVIDIA].alt;
                minerString="-b 127.0.0.1:4097 -a "+algo;
                if (configModule.config.nvidia.proxy!== null && configModule.config.nvidia.proxy !== "")
                  minerString+=" -x "+configModule.config.nvidia.proxy;
                minerString+=" -o "+stats.nvidia.url+" -u "+configModule.config.nvidia.btcAddress+"."+configModule.config.rigName+" -p "+configModule.config.rigName;
                if (configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.passwordParam!==undefined && configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.passwordParam!==null&&configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.passwordParam!=="")
                  minerString+=","+configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.passwordParam;
                if (configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.extraParam!==undefined && configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.extraParam!==null&&configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.extraParam!=="")
                  minerString+=" "+configModule.config.benchmarks[bestAlgoNVIDIA].nvidia.extraParam;
                const spawn = require('cross-spawn');
                nvidiaminer = spawn(binPath, minerString.split(" "));
                justStartedNVIDIA=1;
                setTimeout(function (){
                  justStartedNVIDIA=null;
                },5000);
                console.log(colors.green("[NVIDIA] ")+colors.green("miner started, using "+algo));

                nvidiaminer.stdout.on('data', function (data) {
                  if (data.toString().search("accepted") !== -1 || data.toString().search("rejected") !== -1)
                    console.log(colors.green("[NVIDIA] ")+data.toString().trim().slice(30));
                  if (configModule.config.nvidia.writeMinerLog) {
                    nvidia_miner_log.write(data.toString());
                  }
                });

                nvidiaminer.stderr.on('data', function (data) {
                  console.log(colors.green("[NVIDIA] ")+data.toString().trim().slice(30));
                  if (configModule.config.nvidia.writeMinerLog)
                    nvidia_miner_log.write(data.toString());
                });


              }
            }else{
              console.log(colors.green("[NVIDIA] ")+colors.red("no profitibility data or algo available"));
              return false;
            }
          }else{
            console.log(colors.green("[NVIDIA] ")+colors.red("miner already running"));
            return false;
          }
        }else{
          console.log(colors.green("[NVIDIA] ")+colors.red("miner disabled"));
          return false;
        }
      }else{
        console.log(colors.red("invalid miner type"));
        return false;
      }
    }
  } else {
    console.log(colors.red("some required settings are not properly configured"));
    return false;
  }
  return true;
}

function stopMining(req, res, next) {
  if (req.body.type!==undefined&&(req.body.type==="cpu"||req.body.type==="nvidia")) {
    if (stats[req.body.type].running) {
      stopMiner(req.body.type);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({result: true}));
    }else{
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({result: false}));
    }
  }else{
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({result: false}));
  }
}

function stopMiner(type) {
  switch(type){
    case "cpu":
      if (cpuminer !== null) {
        kill(cpuminer.pid);
        cpuminer = null;
        console.log(colors.magenta("[CPU] ")+colors.green("miner stopped"));
      }
      break;
    case "nvidia":
      if (nvidiaminer !== null) {
        kill(nvidiaminer.pid);
        nvidiaminer = null;
        console.log(colors.green("[NVIDIA] ")+colors.green("miner stopped"));
      }
      break;
  }
}

function doBenchmarkWrapper(req, res, next) {
  if (req.body.type!==undefined&&(req.body.type==="cpu"||req.body.type==="nvidia")) {
    if (!stats[req.body.type].benchRunning) {
      wait.launchFiber(doBenchmark,req.body.type);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({result: true}));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({result: false}));
    }
  }else{
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({result: false}));
  }
}

function asyncSleep(param, callback) {
  setTimeout(function () {
    callback(null);
  }, param);
}

function doBenchmark(type) {
  if (validateSettings(type)) {
    if (type==="cpu"){
      if (configModule.config.cpu.enabled){
        stats.cpu.benchRunning = true;
        if (cpuminer !== null) {
          wait.for(stopMiner,type);
        }
        var currentBest = bestAlgoCPU;
        Object.keys(configModule.config.benchmarks).forEach(function (key) {
          if (configModule.config.benchmarks[key].cpu!==undefined && configModule.config.benchmarks[key].cpu.enabled) {
            bestAlgoCPU = key;
            configModule.config.benchmarks[key].cpu.benchRunning = true;
            console.log(colors.magenta("[CPU] ")+"benchmarking: " + key + " ..");
            startMiner(type);
            var i = 0;
            var hashrate = 0;
            while (stats.cpu.hashrate === null || stats.hashrate === 0) {
              wait.for(asyncSleep, 1000);
            }
            wait.for(asyncSleep, 20000);
            for (; i < configModule.config.cpu.benchTime && cpuminer !== null; i++) {
              wait.for(asyncSleep, 1000);
              hashrate += stats.cpu.hashrate;
            }
            configModule.config.benchmarks[key].cpu.benchRunning = false;
            stopMiner(type);
            configModule.config.benchmarks[key].cpu.hashrate = (hashrate) / i;
            console.log(colors.magenta("[CPU] ")+colors.green("avg hashrate: " + configModule.config.benchmarks[key].cpu.hashrate.toFixed(6) + " KH/s"));
            configModule.saveConfig();
          }
        });
        stats.cpu.benchRunning = false;
        bestAlgoCPU = currentBest;
      }else{
        console.log(colors.red("[CPU] miner disabled"));
        return false;
      }

    }else{
      if (type==="nvidia"){
        if (configModule.config.nvidia.enabled){
          stats.nvidia.benchRunning = true;
          if (nvidiaminer !== null) {
            wait.for(stopMiner,type);
          }
          var currentBest = bestAlgoNVIDIA;
          Object.keys(configModule.config.benchmarks).forEach(function (key) {
            if (configModule.config.benchmarks[key].nvidia!==undefined && configModule.config.benchmarks[key].nvidia.enabled) {
              bestAlgoNVIDIA = key;
              configModule.config.benchmarks[key].nvidia.benchRunning = true;
              console.log(colors.green("[NVIDIA] ")+"benchmarking: " + key + " ..");
              startMiner(type);
              var i = 0;
              var hashrate = 0;
              while (stats.nvidia.hashrate === null || stats.nvidia.hashrate === 0) {
                wait.for(asyncSleep, 1000);
              }
              wait.for(asyncSleep, 20000);
              for (; i < configModule.config.nvidia.benchTime && nvidiaminer !== null; i++) {
                wait.for(asyncSleep, 1000);
                hashrate += stats.nvidia.hashrate;
              }
              configModule.config.benchmarks[key].nvidia.benchRunning = false;
              stopMiner(type);
              configModule.config.benchmarks[key].nvidia.hashrate = (hashrate) / i;
              console.log(colors.green("[NVIDIA] ")+colors.green("avg hashrate: " + configModule.config.benchmarks[key].nvidia.hashrate.toFixed(6) + " KH/s"));
              configModule.saveConfig();
            }
          });
          stats.nvidia.benchRunning = false;
          bestAlgoNVIDIA = currentBest;
        }else{
          console.log(colors.red("[NVIDIA] miner disabled"));
          return false;
        }

      }
    }
    return true;
  }
  console.log(colors.red("some required settings are not properly configured"));
  return false;
}

function restartMiner(type){
  stopMiner(type);
  wait.for(asyncSleep, 2000);
  startMiner(type);
}

function getProfitability(type) {
  if (configModule.config.profitabilityServiceUrl!==null&&configModule.config.profitabilityServiceUrl!==""){
    var region="";
    switch (configModule.config[type].region) {
      case 0:
        region += "eu";
        break;
      case 1:
        region += "usa";
        break;
      case 2:
        region += "hk";
        break;
      case 3:
        region += "jp";
        break;
    }
    var query={
      algos:{},
      region:region,
      name:configModule.config.rigName+" ("+type.toUpperCase()+")"
    };
    Object.keys(configModule.config.benchmarks).forEach(function (key) {
      if (configModule.config.benchmarks[key][type]!==undefined && configModule.config.benchmarks[key][type].enabled && configModule.config.benchmarks[key][type].hashrate!==null && configModule.config.benchmarks[key][type].hashrate!=="") {
        query.algos[key]={};
        query.algos[key].hashrate=configModule.config.benchmarks[key][type].hashrate*1000;
      }
    });
    var arr = configModule.config.profitabilityServiceUrl.split(":");
    var req= http.request({
      host: arr[0],
      path: '/api/query',
      method: 'POST',
      port: arr[1],
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    }, function (response) {
      response.setEncoding('utf8');
      var body = '';
      response.on('data', function (d) {
        body += d;
      });
      response.on('end', function () {
        var parsed = null;
        try{
          parsed=JSON.parse(body);
        }catch(error){
          console.log(colors.red("["+type.toUpperCase()+"] Error: Unable to get profitability data"));
          console.log(error);
        }
        if (parsed != null){
          if (parsed.result!==false){
            stats[type].profitabilityPerKH=parsed.result.profitability*1000;
            if (stats[type].url!==parsed.result.url){
              stats[type].url=parsed.result.url;
              if (stats[type].benchRunning === false) {
                if (stats[type].running) {
                  switch (type){
                    case "cpu":
                      console.log(colors.magenta("[CPU] ")+"changing algo: " + bestAlgoCPU + " => " + parsed.result.algo);
                      bestAlgoCPU = parsed.result.algo;
                      wait.launchFiber(restartMiner,type);
                      break;
                    case "nvidia":
                      console.log(colors.green("[NVIDIA] ")+"changing algo: " + bestAlgoNVIDIA + " => " + parsed.result.algo);
                      bestAlgoNVIDIA = parsed.result.algo;
                      wait.launchFiber(restartMiner,type);
                      break;
                  }
                }else{
                  switch(type){
                    case "cpu":
                      bestAlgoCPU = parsed.result.algo;
                      break;
                    case "nvidia":
                      bestAlgoNVIDIA = parsed.result.algo;
                      break;
                  }
                }
              }
            }
          }else
            console.log(colors.red("["+type.toUpperCase()+"] Error: malformed profitability request"));
        }
      });
    }).on("error", function(error) {
      console.log(colors.red("["+type.toUpperCase()+"] Error: Unable to get profitability data"));
      console.log(error);
    });
    req.write(JSON.stringify(query));
    req.end();
  }
}


function getMinerStats(type) {
  var WebSocketClient = require('websocket').client;
  var client = new WebSocketClient();

  client.on('connectFailed', function (error) {
    switch(type){
      case "cpu":
        if (cpuminer!==null&&justStartedCPU===null){
          stopMiner(type);
          startMiner(type);
        }else
          stats[type].running = false;
        break;
      case "nvidia":
        if (nvidiaminer!==null&&justStartedNVIDIA===null){
          stopMiner(type);
          startMiner(type);
        }else
          stats[type].running = false;
        break;
    }
  });

  client.on('connect', function (connection) {
    connection.on('error', function (error) {
      console.log(colors.red("Connection Error: " + error.toString()));
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
        switch(type){
          case "cpu":
            stats[type].temperature = parseFloat(obj.TEMP);
            stats[type].cores = parseFloat(obj.CPUS);
            break;
          case "nvidia":
            stats[type].gpus = parseFloat(obj.GPUS);
            break;
        }
        stats[type].running = true;
        stats[type].accepted = parseFloat(obj.ACC);
        stats[type].acceptedPerMinute = parseFloat(obj.ACCMN);
        stats[type].algorithm = obj.ALGO;
        stats[type].difficulty = parseFloat(obj.DIFF);
        stats[type].hashrate = parseFloat(obj.KHS);
        stats[type].miner = obj.NAME + " " + obj.VER;
        stats[type].rejected = parseFloat(obj.REJ);
        stats[type].uptime = obj.UPTIME;
        stats[type].profitability = stats[type].hashrate * stats[type].profitabilityPerKH;
      }
    });
  });
  switch(type){
    case "cpu":
      client.connect('ws://127.0.0.1:4096/summary', 'text');
      break;
    case "nvidia":
      client.connect('ws://127.0.0.1:4097/summary', 'text');
      break;
  }

}

function checkBenchmark(req, res, next) {
  if (req.body.type!==undefined&&(req.body.type==="cpu"||req.body.type==="nvidia")) {
    if (stats[req.body.type].benchRunning) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({running: true}));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({running: false}));
    }
  }
}

function init() {
  if (configModule.config.cpu.enabled)
    getProfitability("cpu");
  if (configModule.config.nvidia.enabled)
    getProfitability("nvidia");
  getMinerStats("cpu");
  getMinerStats("nvidia");
  if (configModule.config.cpu.enabled&&configModule.config.cpu.autostart) {
    console.log(colors.magenta("[CPU] ")+"autostart enabled, starting miner shortly..");
    setTimeout(function () {
      startMiner("cpu");
    }, 10000);
  }
  if (configModule.config.nvidia.enabled&&configModule.config.nvidia.autostart) {
    console.log(colors.green("[NVIDIA] ")+"autostart enabled, starting miner shortly..");
    setTimeout(function () {
      startMiner("nvidia");
    }, 10000);
  }

  var minutes = 3, profitabilityInterval = minutes * 60 * 1000;
  setInterval(function () {
    if (configModule.config.cpu.enabled)
      getProfitability("cpu");
    if (configModule.config.nvidia.enabled)
      getProfitability("nvidia");
  }, profitabilityInterval);
  setInterval(function () {
    if (configModule.config.cpu.enabled)
      getMinerStats("cpu");
    if (configModule.config.nvidia.enabled)
      getMinerStats("nvidia");
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
