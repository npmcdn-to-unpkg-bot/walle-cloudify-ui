'use strict';

/**
 * @ngdoc function
 * @name cosmoUiAppApp.controller:BlueprintSourceCtrl
 * @description
 * # BlueprintsourceCtrl
 * Controller of the cosmoUiApp
 */
angular.module('cosmoUiApp')
    .controller('BlueprintSourceCtrl', function ($scope, $routeParams, CloudifyService) {

        $scope.blueprintId = $routeParams.blueprintId;
        $scope.errorMessage = 'noPreview';
        var selectedBlueprint;

        $scope.$on('blueprintData', function(event, data){
            selectedBlueprint = data;

            CloudifyService.blueprints.browse({id: $scope.blueprintId, last_update: new Date(selectedBlueprint.updated_at).getTime()})
                .then(function(browseData) {
                    if (browseData.errCode) {
                        $scope.errorMessage = browseData.errCode;
                        return;
                    }
                    $scope.browseData = [browseData];
                    $scope.browseData[0].show = true;
                    $scope.browseData[0].children[0].show = true;
                    locateFilesInBrowseTree(browseData.children);
                    autoOpenSourceFile();
                });
        });

        var autoFilesList = ['blueprint.yaml', 'README.md'];
        var selectedAutoFile = null;
        var firstDefaultFile = null;
        var autoKeepLooking = true;

        function locateFilesInBrowseTree(data) {
            for(var i in data) {
                if(!autoKeepLooking) {
                    break;
                }
                var pos = autoFilesList.indexOf(data[i].name);
                if(pos > -1) {
                    selectedAutoFile = data[i];
                }
                if(pos !== 0) {
                    locateFilesInBrowseTree(data[i].children);
                }
                else {
                    autoKeepLooking = false;
                }
                if(!data[i].hasOwnProperty('children') && firstDefaultFile === null) {
                    firstDefaultFile = data[i];
                }
            }
        }

        function autoOpenSourceFile() {
            if(selectedAutoFile !== null) {
                $scope.openSourceFile(selectedAutoFile);
            }
            else if(firstDefaultFile !== null) {
                $scope.openSourceFile(firstDefaultFile);
            }
        }

        function getBrashByFile(file) {
            var ext = file.split('.');
            switch(ext[ext.length-1]) {
            case 'sh':
                return 'bash';
            case 'bat':
                return 'bat';
            case 'cmd':
                return 'cmd';
            case 'ps1':
                return 'powershell';
            case 'yaml':
                return 'yml';
            case 'py':
                return 'py';
            case 'md':
                return 'text';
            case 'html':
                return 'text';
            default:
                return 'text';
            }
        }

        $scope.openTreeFolder = function(data) {
            if(!data.hasOwnProperty('show')) {
                data.show = true;
            }
            else {
                data.show = !data.show;
            }
        };

        $scope.isFolderOpen = function(data) {
            if(data.hasOwnProperty('show') && data.show === true) {
                return 'fa-minus-square-o';
            }
            return 'fa-plus-square-o';
        };

        $scope.setBrowseType = function(data) {
            if(data.hasOwnProperty('children')) {
                return 'folder';
            }
            return 'file-' + data.encoding;
        };

        $scope.isSelected = function(fileName) {
            if($scope.filename === fileName) {
                return 'current';
            }
        };

        $scope.openSourceFile = function(data) {
            CloudifyService.blueprints.browseFile({id: $scope.blueprintId, path: new Date(selectedBlueprint.updated_at).getTime() + '/' + data.relativePath})
                .then(function(fileContent) {
                    $scope.dataCode = {
                        data: fileContent,
                        brush: getBrashByFile(data.name),
                        path: data.path
                    };
                    $scope.filename = data.name;
                });
        };

        $scope.isSourceText = function(fileName) {
            if (fileName === undefined) {
                return;
            }
            var textExt = ['yaml', 'js', 'css', 'sh', 'txt', 'bat', 'cmd', 'ps1', 'py', 'md', 'html'];
            var fileExt = fileName.substr(fileName.lastIndexOf('.') + 1);
            return textExt.indexOf(fileExt) > -1;

        };

    });
