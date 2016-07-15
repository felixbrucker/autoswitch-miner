/**
 * @namespace setupCtrl
 *
 * @author: Felix Brucker
 * @version: v0.0.1
 *
 * @description
 * handles functionality for the setup page
 *
 */
(function () {
    'use strict';

    angular
        .module('app')
        .controller('setupCtrl', setupController);

    function setupController($scope,$interval,$http) {

        var vm = this;

        // controller API
        vm.init = init;



        /**
         * @name init
         * @desc data initialization function
         * @memberOf setupCtrl
         */
        function init() {
            angular.element(document).ready(function () {

            });
        }



        // call init function on firstload
        vm.init();
    }

})();