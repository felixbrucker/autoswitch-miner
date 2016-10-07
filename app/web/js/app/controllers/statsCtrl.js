/**
 * @namespace statsCtrl
 *
 * @author: Felix Brucker
 * @version: v0.0.1
 *
 * @description
 * handles functionality for the stats page
 *
 */
(function () {
  'use strict';

  angular
    .module('app')
    .controller('statsCtrl', statsController);

  function statsController($scope, $interval, $http) {

    var vm = this;
    vm.statsInterval = null;
    vm.current = {
      cpu:{},
      nvidia:{},
      custom:{},
      rigName:null
    };
    vm.waitingCPU = null;
    vm.waitingNVIDIA = null;
    vm.waitingCUSTOM = null;

    // controller API
    vm.init = init;
    vm.getStats = getStats;
    vm.startMiner = startMiner;
    vm.stopMiner = stopMiner;


    /**
     * @name init
     * @desc data initialization function
     * @memberOf statsCtrl
     */
    function init() {
      angular.element(document).ready(function () {
        vm.getStats();
        vm.statsInterval = $interval(vm.getStats, 2000);
      });
    }

    /**
     * @name getStats
     * @desc get the stats
     * @memberOf statsCtrl
     */
    function getStats() {
      $http({
        method: 'GET',
        url: 'api/mining/stats'
      }).then(function successCallback(response) {
        vm.current.cpu = response.data.cpu;
        vm.current.nvidia = response.data.nvidia;
        vm.current.custom = response.data.custom;
        vm.current.rigName = response.data.rigName;
      }, function errorCallback(response) {
        console.log(response);
      });
    }

    /**
     * @name startMiner
     * @desc start the Miner
     * @memberOf statsCtrl
     */
    function startMiner(type) {
      switch(type){
        case "cpu":
          vm.waitingCPU = true;
          break;
        case "nvidia":
          vm.waitingNVIDIA = true;
          break;
        case "custom":
          vm.waitingCUSTOM = true;
          break;
      }

      $http({
        method: 'POST',
        url: 'api/mining/start',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        },
        data: {type:type}
      }).then(function successCallback(response) {
        setTimeout(function(){
          switch(type){
            case "cpu":
              vm.waitingCPU = false;
              break;
            case "nvidia":
              vm.waitingNVIDIA = false;
              break;
            case "custom":
              vm.waitingCUSTOM = false;
              break;
          }
        }, 1000);
        if (response.data.result === true) {
          vm.getStats();
        }
      }, function errorCallback(response) {
        console.log(response);
      });
    }


    /**
     * @name stopMiner
     * @desc stop the Miner
     * @memberOf statsCtrl
     */
    function stopMiner(type) {
      switch(type){
        case "cpu":
          vm.waitingCPU = true;
          break;
        case "nvidia":
          vm.waitingNVIDIA = true;
          break;
        case "custom":
          vm.waitingCUSTOM = true;
          break;
      }
      $http({
        method: 'POST',
        url: 'api/mining/stop',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        },
        data: {type:type}
      }).then(function successCallback(response) {
        setTimeout(function(){
          switch(type){
            case "cpu":
              vm.waitingCPU = false;
              break;
            case "nvidia":
              vm.waitingNVIDIA = false;
              break;
            case "custom":
              vm.waitingCUSTOM = false;
              break;
          }
        }, 1000);
        if (response.data.result === true) {
          vm.getStats();
        }
      }, function errorCallback(response) {
        console.log(response);
      });
    }


    $scope.$on('$destroy', function () {
      if (vm.statsInterval)
        $interval.cancel(vm.statsInterval);
    });

    // call init function on firstload
    vm.init();
  }

})();
