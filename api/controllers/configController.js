'use strict';

function getConfig(req, res, next) {
console.log("getConfig");
  //check if alrdy saved
  //else load from file
  //return object as json
}
function setConfig(req, res, next) {
  console.log("setConfig");
  //overwrite object with json
  //save to file
  //return state: failed, ok
}
function doBenchmark(req, res, next) {
  console.log("doBenchmark");
  //start benchmark command for given algo
  //async?
  //return result
}
function setup(req, res, next) {
  console.log("setup");
  //check if already set up?
  //return false if so
  //else return setup page json
}

exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.doBenchmark = doBenchmark;
exports.setup = setup;
