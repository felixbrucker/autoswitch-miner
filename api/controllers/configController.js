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

function reload(req, res, next) {
  res.sendFile('reload.html', {
    root: './'
  });
  const spawn = require('cross-spawn');
  var child = null;
  var isWin = /^win/.test(process.platform);
  if (isWin)
    child = spawn("cmd.exe",['timeout /t 2 && git pull && npm start'], {
      detached: true,
      stdio: 'ignore'
    });
  else
    child = spawn('sleep 2 && git pull && npm start', {
      detached: true,
      stdio: 'ignore'
    });

  child.unref();
  listener.close();
}

function init() {

}

init();

exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.getCPUModel = getCPUModel;
exports.reload = reload;
