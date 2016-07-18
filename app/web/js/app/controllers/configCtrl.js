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
            benchmarks: null
        };
        vm.waiting = null;
        vm.waitingBenchmark = null;
        vm.configInterval=null;
        vm.benchmarkInterval=null;


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
                vm.configInterval = $interval(vm.getConfig, 10000);
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
                vm.config.benchmarks = response.data.benchmarks;
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
                    if (vm.benchmarkInterval===null) vm.benchmarkInterval = $interval(vm.checkBenchmark, 10000);
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
                    if (vm.benchmarkInterval===null) vm.benchmarkInterval = $interval(vm.checkBenchmark, 10000);
                }else{
                    if (vm.benchmarkInterval!==null){
                        $interval.cancel(vm.benchmarkInterval);
                        vm.benchmarkInterval=null;
                    }
                    vm.waitingBenchmark = false;
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