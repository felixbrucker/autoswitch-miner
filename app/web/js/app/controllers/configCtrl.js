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
            region: null,
            regions: null,
            btcAddress: null,
            proxy: null,
            binPath: null,
            autostart:null,
            benchmarks: null,
            benchTime: null,
            rigName: null,
            cores: null,
            writeMinerLog: null
        };
        vm.waiting = null;
        vm.waitingBenchmark = null;
        vm.configInterval=null;
        vm.benchmarkInterval=null;
        vm.profitabilityString=null;


        // controller API
        vm.init = init;
        vm.getConfig=getConfig;
        vm.setConfig=setConfig;
        vm.doBenchmark=doBenchmark;
        vm.checkBenchmark=checkBenchmark;



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
                vm.config.region = response.data.region;
                vm.config.regions = response.data.regions;
                vm.config.btcAddress = response.data.btcAddress;
                vm.config.proxy = response.data.proxy;
                vm.config.binPath = response.data.binPath;
                vm.config.autostart=response.data.autostart;
                vm.config.benchmarks = response.data.benchmarks;
                vm.config.benchTime = response.data.benchTime;
                vm.config.rigName = response.data.rigName;
                vm.config.cores=response.data.cores;
                vm.config.writeMinerLog=response.data.writeMinerLog;
                vm.profitabilityString="&name="+vm.config.rigName;
                Object.keys(vm.config.benchmarks).forEach(function (key) {
                    var submitHashrate=vm.config.benchmarks[key].hashrate;
                    if (vm.config.benchmarks[key].submitUnit===0)
                        submitHashrate*=1000;
                    for (var i = 1; i < vm.config.benchmarks[key].submitUnit; i++) {
                        submitHashrate/=1000;
                    }
                    vm.profitabilityString+="&speed"+vm.config.benchmarks[key].id+"="+submitHashrate.toFixed(2);
                });
                vm.profitabilityString+="&cost=0&power=0";
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
         * @name doBenchmark
         * @desc starts the benchmark
         * @memberOf configCtrl
         */
        function doBenchmark() {
            vm.waitingBenchmark=true;
            vm.setConfig().then(function successCallback(response){
                return $http({
                    method: 'POST',
                    url: 'api/mining/benchmark'
                }).then(function successCallback(response) {
                    if (vm.benchmarkInterval===null) vm.benchmarkInterval = $interval(vm.checkBenchmark, 5000);
                    if (vm.configInterval===null) vm.configInterval = $interval(vm.getConfig, 10000);
                    vm.getConfig();
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
        function checkBenchmark(){
            return $http({
                method: 'GET',
                url: 'api/mining/benchmark/current'
            }).then(function successCallback(response) {
                if (response.data.running===true){
                    vm.waitingBenchmark=true;
                    if (vm.benchmarkInterval===null) vm.benchmarkInterval = $interval(vm.checkBenchmark, 5000);
                    if (vm.configInterval===null) vm.configInterval = $interval(vm.getConfig, 10000);
                }else{
                    if (vm.benchmarkInterval!==null){
                        $interval.cancel(vm.benchmarkInterval);
                        vm.benchmarkInterval=null;
                    }
                    if (vm.configInterval!==null) {
                        $interval.cancel(vm.configInterval);
                        vm.configInterval=null;
                    }
                    vm.waitingBenchmark = false;
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
            if (vm.benchmarkInterval)
                $interval.cancel(vm.benchmarkInterval);
        });
    }

})();
