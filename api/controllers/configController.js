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
function setup(req, res, next) {
  console.log("setup");
  //check if already set up?
  //return false if so
  //else return setup page json
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({success: true}));
}


function init() {

}

init();

exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.setup = setup;
