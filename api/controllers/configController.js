'use strict';

var configModule = require(__basedir + 'api/modules/configModule');


function getConfig(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(configModule.config));
}
function setConfig(req, res, next) {
  configModule.setConfig(req.body);
  configModule.saveConfig();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({result: true}));
}

function update(req, res, next) {
  const spawn = require('cross-spawn');
  const child = spawn('git',['pull'],{
      detached: true,
      stdio: 'ignore',
      shell:true
    });
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({result:true}));
}

function updateMiner(req, res, next) {
  runUpdateScript();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({result:true}));
}

function runUpdateScript(){
  var miningController = require(__basedir + 'api/controllers/miningController');
  if (cpuminer!==null){
    miningController.stopMiner("cpu");
  }
  if (nvidiaminer!==null){
    miningController.stopMiner("nvidia");
  }
  const spawn = require('cross-spawn');
  const child = spawn('bash',['update.sh'],{
    detached: true,
    stdio: 'ignore',
    shell:true
  });
}

function init() {
}

init();

exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.update = update;
exports.updateMiner = updateMiner;
