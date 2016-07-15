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



        // controller API
        vm.init = init;




        /**
         * @name init
         * @desc data initialization function
         * @memberOf configCtrl
         */
        function init() {
            angular.element(document).ready(function () {

            });
        }



        // call init function on firstload
        vm.init();
    }

})();