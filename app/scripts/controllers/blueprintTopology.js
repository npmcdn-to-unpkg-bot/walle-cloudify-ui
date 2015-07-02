'use strict';

angular.module('cosmoUiApp')
    .controller('BlueprintTopologyCtrl', function ($scope, $routeParams, $rootScope, NodeService, blueprintCoordinateService) {
        $scope.blueprintId = $routeParams.blueprintId;
        $scope.page = {};


        $scope.onNodeSelect = function(node){
            console.log('node selected',node);
            $scope.viewNode(node,'node');
        };

        $scope.onRelationshipSelect = function( relationship ){
            $scope.viewNode(relationship, 'relationship');
        };


        $scope.$on('blueprintData', function(event, data){
            $scope.planNodes = data.plan.nodes;
            $scope.nodesTree = NodeService.createNodesTree(data.plan.nodes);
            blueprintCoordinateService.resetCoordinates();
            blueprintCoordinateService.setMap(_getNodesConnections(data.plan.nodes));
            $scope.coordinates = blueprintCoordinateService.getCoordinates();
        });

        function _getNodesConnections(nodes) {
            var connections = [];
            nodes.forEach(function (node) {
                var relationships = $scope.getRelationshipByType(node, 'connected_to');
                relationships.forEach(function(connection) {
                    connections.push({
                        source: node.id,
                        target: connection.target_id,
                        type: connection.type,
                        typeHierarchy: connection.type_hierarchy
                    });
                });
            });
            return connections;
        }

        $scope.getRelationshipByType = function(node, type) {
            var relationshipData = [];
            if (node.relationships !== undefined) {
                for (var i = 0; i < node.relationships.length; i++) {
                    if (node.relationships[i].type_hierarchy.join(',').indexOf(type) > -1) {
                        relationshipData.push(node.relationships[i]);
                    }
                }
            }
            return relationshipData;
        };

        $scope.viewNode = function (viewNode, nodeType) {
            viewNode.nodeType = nodeType;
            $scope.page.viewNode = viewNode;
        };
    });
