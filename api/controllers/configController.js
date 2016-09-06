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
  res.send(JSON.stringify({success: true}));
}

function getCPUModel(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({cpuModel: configModule.cpuModel}));
}

function update(req, res, next) {
  const spawn = require('cross-spawn');
  const child = spawn('git',['pull'],{
      detached: true,
      stdio: 'ignore',
      shell:true
    });
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({success:true}));
}

function updateMiner(req, res, next) {
  var miningController = require(__basedir + 'api/controllers/miningController');
  if (cpuminer!==null&&cpuminer!==""){
    miningController.stopMiner();
  }
  const spawn = require('cross-spawn');
  const child = spawn('update.sh',{
    detached: true,
    stdio: 'ignore',
    shell:true
  });
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({success:true}));
}

function init() {

}

init();

exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.getCPUModel = getCPUModel;
exports.update = update;
exports.updateMiner = updateMiner;
