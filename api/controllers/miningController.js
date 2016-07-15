'use strict';

function getStats(req, res, next) {
  console.log("getStats");
  //check if running?
  //return stuff or stats as json
}
function getAlgos(req, res, next) {
  console.log("getAlgos");
  //return algos as json
}
function startMining(req, res, next) {
  console.log("startMining");
  //if not already running start, else return alrdy running
}
function stopMining(req, res, next) {
  console.log("stopMining");
  //if not already stopped stop, else return alrdy stopped
}

exports.getStats = getStats;
exports.getAlgos = getAlgos;
exports.startMining = startMining;
exports.stopMining = stopMining;
