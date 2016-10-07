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
            nvidia:{},
            rigName: null,
            regions: null,
            benchmarks: {},
            profitabilityServiceUrl: null,
            custom:null
        };
        vm.waiting = null;
        vm.waitingBenchmarkCPU = null;
        vm.waitingBenchmarkNVIDIA = null;
        vm.configInterval=null;
        vm.benchmarkIntervalCPU=null;
        vm.benchmarkIntervalNVIDIA=null;
        vm.profitabilityString=null;
        vm.updating=null;
        vm.updatingMiner=null;

        vm.newCustomMiner={
            id:null,
            enabled:true,
            binPath:"",
            cmdline:"",
            writeMinerLog:true,
            shell:false
        };


        // controller API
        vm.init = init;
        vm.getConfig=getConfig;
        vm.setConfig=setConfig;
        vm.doBenchmark=doBenchmark;
        vm.checkBenchmark=checkBenchmark;
        vm.update=update;
        vm.updateMiner=updateMiner;
        vm.addCustomMiner=addCustomMiner;
        vm.delCustomMiner=delCustomMiner;



        /**
         * @name init
         * @desc data initialization function
         * @memberOf configCtrl
         */
        function init() {
            angular.element(document).ready(function () {
                vm.getConfig();
                vm.checkBenchmark("cpu");
                vm.checkBenchmark("nvidia");
            });
        }

        /**
         * @name addCustomMiner
         * @desc add new custom miner to array
         * @memberOf configCtrl
         */
        function addCustomMiner() {
            if (vm.newCustomMiner.binPath!==""&&vm.newCustomMiner.binPath!==null&&vm.newCustomMiner.cmdline!==""&&vm.newCustomMiner.cmdline!==null){
                //gen unique id
                vm.newCustomMiner.id=Date.now();
                //add to array
                vm.config.custom.entries.push(JSON.parse(JSON.stringify(vm.newCustomMiner)));
                //clear variables
                vm.newCustomMiner.id=null;
                vm.newCustomMiner.enabled=true;
                vm.newCustomMiner.binPath="";
                vm.newCustomMiner.cmdline="";
                vm.newCustomMiner.writeMinerLog=true;
                vm.setConfig();
            }
        }

        /**
         * @name delCustomMiner
         * @desc delete custom miner from array
         * @memberOf configCtrl
         */
        function delCustomMiner(id) {
            vm.config.custom.entries.forEach(function (entry,index,array) {
                if (entry.id===id){
                    console.log("a");
                    vm.config.custom.entries.splice(index,1);
                }

            });
            vm.setConfig();
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
                vm.config.nvidia = response.data.nvidia;
                vm.config.benchmarks = response.data.benchmarks;
                vm.config.rigName = response.data.rigName;
                vm.config.regions = response.data.regions;
                vm.config.profitabilityServiceUrl=response.data.profitabilityServiceUrl;
                vm.config.custom=response.data.custom;
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
                case "nvidia":
                    vm.waitingBenchmarkNVIDIA=true;
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
                            case "nvidia":
                                if (vm.benchmarkIntervalNVIDIA===null) vm.benchmarkIntervalNVIDIA = $interval( function() {vm.checkBenchmark(type)}, 5000);
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
                        case "nvidia":
                            vm.waitingBenchmarkNVIDIA=true;
                            if (vm.benchmarkIntervalNVIDIA===null) vm.benchmarkIntervalNVIDIA = $interval( function() {vm.checkBenchmark(type)}, 5000);
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
                        case "nvidia":
                            vm.waitingBenchmarkNVIDIA=false;
                            if (vm.benchmarkIntervalNVIDIA!==null) {
                                $interval.cancel(vm.benchmarkIntervalNVIDIA);
                                vm.benchmarkIntervalNVIDIA=null;
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
            if (vm.benchmarkIntervalNVIDIA)
                $interval.cancel(vm.benchmarkIntervalNVIDIA);
        });
    }

})();
