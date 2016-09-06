'use strict';

var express = require('express');

module.exports = function(app) {
  var router = express.Router();

  var configController = require(__basedir + 'api/controllers/configController');
  var miningController = require(__basedir + 'api/controllers/miningController');

  router.get('/config', configController.getConfig);
  router.post('/config', configController.setConfig);
  router.get('/config/cpumodel', configController.getCPUModel);
  router.get('/config/reload', configController.reload);

  router.get('/mining/stats', miningController.getStats);
  router.post('/mining/start', miningController.startMining);
  router.post('/mining/stop', miningController.stopMining);
  router.post('/mining/benchmark', miningController.doBenchmarkWrapper);
  router.get('/mining/benchmark/current', miningController.checkBenchmark);

  app.use('/api', router);
}