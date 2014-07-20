'use strict';

angular.module('cosmoUiApp')
    .controller('DeployDialogCtrl', function ($scope, RestService) {
        $scope.deployment_id = null;
        $scope.deployError = false;
        $scope.deployErrorMessage = 'Error deploying blueprint';

        $scope.isDeployEnabled = function() {
            return $scope.deployment_id !== null && $scope.deployment_id.length > 0;
        };

        $scope.deployBlueprint = function(blueprint) {
            if (!_validateDeploymentName($scope.deployment_id)) {
                return;
            }
            $scope.deployError = false;

            var params = {
                blueprint_id: blueprint.id,
                deployment_id: $scope.deployment_id
            };

            if ($scope.isDeployEnabled()) {
                $scope.inProcess = true;
                RestService.deployBlueprint(params)
                    .then(function(data) {
                        $scope.inProcess = false;
                        if(data.hasOwnProperty('message')) {
                            $scope.deployErrorMessage = data.message;
                            $scope.deployError = true;
                        }
                        else {
                            $scope.redirectToDeployment($scope.deployment_id, blueprint.id);
                        }
                    });
            }
        };

        $scope.isDeployError = function() {
            return $scope.deployError;
        };

        $scope.closeDialog = function() {
            $scope.toggleDeployDialog();
        };

        // Temporary solution - should be handled by Cosmo, not UI side
        function _validateDeploymentName(deploymentName) {
            if(/[^a-zA-Z0-9_]/.test(deploymentName)) {
                $scope.deployErrorMessage = 'Invalid deployment name. Only Alphanumeric text allowed.';
                $scope.deployError = true;

                return false;
            }
            return true;
        }
    });
