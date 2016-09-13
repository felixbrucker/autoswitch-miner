/**
 * @namespace configCtrl
 *
 * @author: Felix Brucker
 * @version: v0.0.1
 *
 * @description
 * handles functionality for the config page
 *
 */
(function () {
    'use strict';

    angular
        .module('app')
        .controller('configCtrl', configController);

    function configController($scope,$interval,$http) {

        var vm = this;
        vm.config = {
            cpu:{},
            gpu:{},
            rigName: null,
            regions: null,
            benchmarks: {},
            profitabilityServiceUrl: null
        };
        vm.waiting = null;
        vm.waitingBenchmarkCPU = null;
        vm.waitingBenchmarkGPU = null;
        vm.configInterval=null;
        vm.benchmarkIntervalCPU=null;
        vm.benchmarkIntervalGPU=null;
        vm.profitabilityString=null;
        vm.updating=null;
        vm.updatingMiner=null;


        // controller API
        vm.init = init;
        vm.getConfig=getConfig;
        vm.setConfig=setConfig;
        vm.doBenchmark=doBenchmark;
        vm.checkBenchmark=checkBenchmark;
        vm.update=update;
        vm.updateMiner=updateMiner;



        /**
         * @name init
         * @desc data initialization function
         * @memberOf configCtrl
         */
        function init() {
            angular.element(document).ready(function () {
                vm.getConfig();
                vm.checkBenchmark();
            });
        }

        /**
         * @name getConfig
         * @desc get the config
         * @memberOf configCtrl
         */
        function getConfig() {
            return $http({
                method: 'GET',
                url: 'api/config'
            }).then(function successCallback(response) {
                vm.config.cpu = response.data.cpu;
                vm.config.gpu = response.data.gpu;
                vm.config.benchmarks = response.data.benchmarks;
                vm.config.rigName = response.data.rigName;
                vm.config.regions = response.data.regions;
                vm.config.profitabilityServiceUrl=response.data.profitabilityServiceUrl;
            }, function errorCallback(response) {
                console.log(response);
            });
        }


        /**
         * @name setConfig
         * @desc set the config
         * @memberOf configCtrl
         */
        function setConfig() {
            vm.waiting=true;
            return $http({
                method: 'POST',
                url: 'api/config',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                data: vm.config
            }).then(function successCallback(response) {
                setTimeout(function(){vm.waiting = false;},500);
            }, function errorCallback(response) {
                console.log(response);
            });
        }

        /**
         * @name update
         * @desc updates the project from git
         * @memberOf configCtrl
         */
        function update() {
            vm.updating=true;
            return $http({
                method: 'POST',
                url: 'api/config/update',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                }
            }).then(function successCallback(response) {
                setTimeout(function(){vm.updating = false;},500);
            }, function errorCallback(response) {
                console.log(response);
            });
        }

        /**
         * @name updateMiner
         * @desc updates the miner from git
         * @memberOf configCtrl
         */
        function updateMiner() {
            vm.updatingMiner=true;
            return $http({
                method: 'POST',
                url: 'api/config/updateMiner',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                }
            }).then(function successCallback(response) {
                setTimeout(function(){vm.updatingMiner = false;},500);
            }, function errorCallback(response) {
                console.log(response);
            });
        }


        /**
         * @name doBenchmark
         * @desc starts the benchmark
         * @memberOf configCtrl
         */
        function doBenchmark(type) {
            switch(type){
                case "cpu":
                    vm.waitingBenchmarkCPU=true;
                    break;
                case "gpu":
                    vm.waitingBenchmarkGPU=true;
                    break;
            }
            vm.setConfig().then(function successCallback(response){
                return $http({
                    method: 'POST',
                    url: 'api/mining/benchmark',
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8'
                    },
                    data: {type:type}
                }).then(function successCallback(response) {
                    if (response.data.result===true){
                        switch(type){
                            case "cpu":
                                if (vm.benchmarkIntervalCPU===null) vm.benchmarkIntervalCPU = $interval( function() {vm.checkBenchmark(type)}, 5000);
                                break;
                            case "gpu":
                                if (vm.benchmarkIntervalGPU===null) vm.benchmarkIntervalGPU = $interval( function() {vm.checkBenchmark(type)}, 5000);
                                break;
                        }
                        if (vm.configInterval===null) vm.configInterval = $interval(vm.getConfig, 10000);
                        vm.getConfig();
                    }else{
                        alert("it seems the miner type was sent unsuccessfully or the benchmark is already running");
                    }
                }, function errorCallback(response) {
                    console.log(response);
                });
            },function errorCallback(response){
                console.log(response);
            });
        }


        /**
         * @name checkBenchmark
         * @desc checks the benchmark
         * @memberOf configCtrl
         */
        function checkBenchmark(type){
            return $http({
                method: 'POST',
                url: 'api/mining/benchmark/current',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                data: {type:type}
            }).then(function successCallback(response) {
                if (response.data.running===true){
                    switch(type){
                        case "cpu":
                            vm.waitingBenchmarkCPU=true;
                            if (vm.benchmarkIntervalCPU===null) vm.benchmarkIntervalCPU = $interval( function() {vm.checkBenchmark(type)}, 5000);
                            break;
                        case "gpu":
                            vm.waitingBenchmarkGPU=true;
                            if (vm.benchmarkIntervalGPU===null) vm.benchmarkIntervalGPU = $interval( function() {vm.checkBenchmark(type)}, 5000);
                            break;
                    }
                    if (vm.configInterval===null) vm.configInterval = $interval(vm.getConfig, 10000);
                }else{
                    switch(type){
                        case "cpu":
                            vm.waitingBenchmarkCPU=false;
                            if (vm.benchmarkIntervalCPU!==null) {
                                $interval.cancel(vm.benchmarkIntervalCPU);
                                vm.benchmarkIntervalCPU=null;
                            }
                            break;
                        case "gpu":
                            vm.waitingBenchmarkGPU=false;
                            if (vm.benchmarkIntervalGPU!==null) {
                                $interval.cancel(vm.benchmarkIntervalGPU);
                                vm.benchmarkIntervalGPU=null;
                            }
                            break;
                    }
                    if (vm.configInterval!==null) {
                        $interval.cancel(vm.configInterval);
                        vm.configInterval=null;
                    }
                    vm.getConfig();
                }
            }, function errorCallback(response) {
                console.log(response);
            });

        }

        // call init function on firstload
        vm.init();

        $scope.$on('$destroy', function () {
            if (vm.configInterval)
                $interval.cancel(vm.configInterval);
            if (vm.benchmarkIntervalCPU)
                $interval.cancel(vm.benchmarkIntervalCPU);
            if (vm.benchmarkIntervalGPU)
                $interval.cancel(vm.benchmarkIntervalGPU);
        });
    }

})();
