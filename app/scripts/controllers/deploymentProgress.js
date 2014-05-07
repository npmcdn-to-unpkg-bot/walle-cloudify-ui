'use strict';

angular.module('cosmoUi')
    .controller('DeploymentProgressCtrl', function ($scope) {
        $scope.panelOpen = false;

        $scope.togglePanel = function() {
            $scope.panelOpen = $scope.panelOpen === false;
        };
    });
