'use strict';

angular.module('cosmoUi')
    .controller('PopupCtrl', function ($scope) {
        var selectedFile = null;
        $scope.mainFileName = 'mezzanine-app/mezzanine_blueprint.yaml'; // just until cosmo team will resolve this issue.
        $scope.uploadEnabled = false;
        $scope.uploadInProcess = false;

        $scope.onFileSelect = function ($files) {
            selectedFile = $files[0];
            $scope.elements.find('#browseTxt').val(selectedFile.name);
            console.log(['files were selected', $files]);
        };

        $scope.uploadFile = function() {
            console.log(['upload: ', selectedFile]);

            if (!$scope.isUploadEnabled()) {
                return;
            }

            var planForm = new FormData();
            planForm.append('application_file', $scope.mainFileName);
            planForm.append('application_archive', selectedFile);
            $scope.uploadInProcess = true;

            $.ajax({
                url: '/backend/blueprints/add',
                data: planForm,
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                xhrFields: {
                    onprogress: function (e) {
                        if (e.lengthComputable) {
                            console.log('Loaded ' + (e.loaded / e.total * 100) + '%');
                        } else {
                            console.log('Length not computable.');
                        }
                    }
                },
                success: function() {
                    $scope.uploadInProcess = false;
                    $scope.loadBlueprints();
                    $scope.closeDialog();
                },
                error: function() {
                    $scope.uploadInProcess = false;
                }
            });
        };

        $scope.closeDialog = function() {
            $scope.toggleAddDialog();
        };

        $scope.isUploadEnabled = function() {
            return (selectedFile !== null && $scope.mainFileName !== undefined && $scope.mainFileName.length > 0 && !$scope.uploadInProcess);
        };
    });
