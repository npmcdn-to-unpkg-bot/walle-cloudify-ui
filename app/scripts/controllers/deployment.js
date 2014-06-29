'use strict';

angular.module('cosmoUiApp')
    .controller('DeploymentCtrl', function ($scope, $rootScope, $cookieStore, $routeParams, RestService, EventsService, BreadcrumbsService, blueprintCoordinateService, bpNetworkService, $route, $anchorScroll, $timeout, $location, $log, EventsMap, monitoringGraphs, $localStorage, $filter) {

        var statesIndex = ['uninitialized', 'initializing', 'creating', 'created', 'configuring', 'configured', 'starting', 'started'],
            currentExeution = null,
            isGotExecuteNodes = false;

        var deploymentDataModel = {
            'status': -1, // -1 = not executed, 0 = (install) in progress, 1 = (done) all done and reachable, 2 = (alert) all done but half reachable, 3 = (failed) all done and not reachable
            'state': 0,
            'states': 0,
            'completed': 0,
            'total': 0,
            'process': 0,
            'instancesIds': []
        };

        var deploymentModel = {};

        $scope.selectedWorkflow = {
            data: null
        };
        $scope.deploymentInProgress = false;
        $scope.nodes = [];
        $scope.events = [];
        $scope.section = 'topology';
        $scope.propSection = 'general';
        $scope.topologySettings = [
            {name: 'connections',   state: true},
            {name: 'modules',       state: false},
            {name: 'middleware',    state: true},
            {name: 'compute',       state: true}
        ];
        $scope.toggleBar = {
            'compute': true,
            'middleware': true,
            'modules': true,
            'connections': true
        };
        $scope.selectedRelationship = '';
        $scope.allNodesArr = [];
        $scope.selectNodesArr = [];
        $scope.selectedNode = null;
        $scope.executedData = null;
        $scope.isConfirmationDialogVisible = false;
        $scope.showProgressPanel = false;

        var id = $routeParams.id;
        var blueprint_id = $routeParams.blueprint_id;
        var relations = [];
        var _colors = ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#4b6c8b', '#550000', '#dc322f', '#FF6600', '#cce80b', '#003300', '#805e00'];
        var _colorIdx = 0;
        var nodesList = [];

        BreadcrumbsService.push('deployments',
            {
                href: '#/deployments',
                label: blueprint_id,
                id: 'deployment_id'
            });

        BreadcrumbsService.push('deployments',
            {
                href: '',
                label: id,
                id: 'deployment'
            });


        $scope.getEventIcon = function(event) {
            return EventsMap.getEventIcon(event);
        };

        $scope.getEventText = function(event) {
            return EventsMap.getEventText(event);
        };

        $scope.showRelationship = function(relationship) {
            if (relationship === $scope.selectedRelationship) {
                $scope.selectedRelationship = '';
            } else {
                $scope.selectedRelationship = relationship;
            }
        };

        $scope.showRelationshipList = function(target_id) {
            return $scope.selectedRelationship.target_id === target_id;
        };

        $scope.nodeSelected = function(node) {
            $scope.selectedNode = node;

            if (node !== null) {
                $scope.showProperties = {
                    properties: node.properties,
                    relationships: node.relationships,
                    general: {
                        'name': node.id,
                        'type': node.type,
                        'state': node.runtime_properties !== null ? node.runtime_properties.state : 'N/A',
                        'ip': node.runtime_properties !== null ? node.runtime_properties.ip : 'N/A'
                    }
                };
                $scope.propSection = 'general';
            } else {
                $scope.propSection = 'overview';
            }
        };

        $scope.getNodeStateData = function(nodeId) {
            for(var i = 0; i < $scope.nodes.length; i++) {
                if ($scope.nodes[i].id === nodeId) {
                    return $scope.nodes[i];
                }
            }
        };

        $scope.executeDeployment = function() {
            if ($scope.isExecuteEnabled()) {
                RestService.executeDeployment({
                    deployment_id: id,
                    workflow_id: $scope.selectedWorkflow.data.value
                }).then(function(execution) {
                    $cookieStore.put('executionId', execution.id);
                });

                $cookieStore.remove('deployment_id');
                $cookieStore.put('deployment_id', id);
                $scope.refreshPage();
            }
        };

        $scope.workflowSelected = function(workflow) {
            $scope.selectedWorkflow.data = workflow;
        };

        $scope.cancelExecution = function() {
            var callParams = {
                'execution_id': $scope.executedData.id,
                'state': 'cancel'
            };
            RestService.updateExecutionState(callParams).then(function() {
                $scope.executedData = null;
            });
        };

        $scope.isExecuteEnabled = function() {
            return $scope.selectedWorkflow.data !== null;
        };

        $scope.$watch('deploymentInProgress', function() {
            if ($scope.deploymentInProgress === true) {
                $scope.showProgressPanel = true;
            }
        });

        $scope.toggleConfirmationDialog = function(deployment, confirmationType) {
            if (confirmationType === 'execute' && $scope.selectedWorkflow.data === null) {
                return;
            }
            $scope.confirmationType = confirmationType;
            $scope.selectedDeployment = deployment || null;
            $scope.isConfirmationDialogVisible = $scope.isConfirmationDialogVisible === false;
        };

        $scope.confirmConfirmationDialog = function(deployment) {
            if ($scope.confirmationType === 'execute') {
                $scope.executeDeployment();
            } else if ($scope.confirmationType === 'cancel') {
                $scope.cancelExecution(deployment);
                $scope.toggleConfirmationDialog();
            }
        };

        $scope.refreshPage = function () {
            $log.info('refreshing deployment page');
            $route.reload();
        };

        function _loadExecutions() {
            RestService.getDeploymentExecutions(id)
                .then(function(data) {
                    if (data.length > 0) {
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].status !== null && data[i].status !== 'failed' && data[i].status !== 'terminated' && data[i].status !== 'canceled') {
                                $scope.executedData = data[i];
                            }
                        }
                    }

                });

            if ($location.path() === '/deployment') {
                $timeout(function(){
                    _loadExecutions();
                }, 60000);
            }
        }

        function _createNetworkTree(nodes, externalNetworks) {
            var networkModel = {
                'external': externalNetworks || [],
                'networks': [],
                'relations': []
            };

            /* Networks */
            networkModel.networks = _getNetworks(nodes);

            networkModel.networks.forEach(function(network) {
                /* Subnets */
                network.subnets = _getSubnets(network, nodes);

                /* Devices */
                network.devices = _getDevices(nodes, networkModel.external);
            });

            networkModel.relations = relations;

            return networkModel;
        }

        function _getNetworks(nodes) {
            var networks = [];

            nodes.forEach(function (node) {
                if (node.type.indexOf('network') > -1) {
                    networks.push({
                        'id': node.id,
                        'name': node.name,
                        'subnets': [],
                        'devices': []
                    });
                }
            });

            return networks;
        }

        function _getSubnets(network, nodes) {
            var subnets = [];

            nodes.forEach(function (node) {

                /* Subnets */
                if (node.type.indexOf('subnet') > -1) {
                    var relationships = $scope.getRelationshipByType(node, 'contained');
                    relationships.forEach(function (relationship) {
                        if (network.id === relationship.target_id) {
                            subnets.push({
                                'id': node.id,
                                'name': node.properties.subnet.name ? node.properties.subnet.name : node.name,
                                'cidr': node.properties.subnet.cidr,
                                'color': getNetworkColor(),
                                'type': 'subnet',
                                'state': {
                                    'total': node.instances.deploy,
                                    'completed': 0
                                }
                            });
                            relations.push({
                                source: node.id,
                                target: network.id,
                                type: relationship.type,
                                typeHierarchy: relationship.type_hierarchy
                            });
                        }
                    });
                }
            });

            return subnets;
        }

        function _getDevices(nodes, externalNetworks) {
            /* Ports */
            var ports = _getPorts(nodes);
            var devices = [];

            nodes.forEach(function (node) {
                if (node.type.indexOf('host') > -1) {
                    var device = {
                        'id': node.id,
                        'name': node.name,
                        'type': 'device',
                        'icon': 'host',
                        'state': {
                            'total': node.instances.deploy,
                            'completed': 0
                        },
                        'ports': []
                    };

                    var relationships = $scope.getRelationshipByType(node, 'connected_to').concat($scope.getRelationshipByType(node, 'depends_on'));
                    relationships.forEach(function (relationship) {
                        ports.forEach(function(port) {
                            if (relationship.target_id === port.id) {
                                var _alreadyExists = false;
                                device.ports.forEach(function(item) {
                                    if (item.id === port.id) {
                                        _alreadyExists = true;
                                    }
                                });
                                if (!_alreadyExists) {
                                    device.ports.push(port);

                                    relations.push({
                                        source: port.subnet,
                                        target: port.id
                                    });
                                }
                            }
                        });
                    });

                    externalNetworks.forEach(function (extNetwork) {
                        if (extNetwork.type === 'subnet') {
                            relations.push({
                                source: extNetwork.id,
                                target: node.id
                            });
                        }
                    });

                    devices.push(device);
                }
            });

            return devices;
        }

        function _getPorts(nodes) {
            var ports = [];

            nodes.forEach(function (node) {
                if (node.type.indexOf('port') > -1) {
                    var relationships = $scope.getRelationshipByType(node, 'depends_on');
                    relationships.forEach(function(relationship) {
                        if (relationship.type.indexOf('depends_on') > -1) {
                            ports.push({
                                'id': node.id,
                                'name': node.name,
                                'type': 'device',
                                'icon': 'port',
                                'subnet': relationship.target_id
                            });
                        }
                    });
                }
            });

            return ports;
        }

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

        function _loadDeployment() {
            RestService.getDeploymentById({deployment_id : id})
                .then(function(deploymentData) {

                    if(deploymentData.hasOwnProperty('error_code')) {
                        $log.error(deploymentData.message);
                        return;
                    }

                    // Set Deployment Model
                    _setDeploymentModel(deploymentData);

                    _loadExecutions();

                    $scope.allNodesArr = deploymentData.plan.nodes;

                    // Blueprint
                    RestService.getBlueprintById({id: deploymentData.blueprint_id})
                        .then(function(data){
                            nodesList = data.plan.nodes;
                            $scope.nodesTree = _createNodesTree(nodesList);
                            $scope.dataTable = data.plan.nodes;

                            blueprintCoordinateService.resetCoordinates();
                            blueprintCoordinateService.setMap(_getNodesConnections(nodesList));
                            $scope.coordinates = blueprintCoordinateService.getCoordinates();
                            $scope.deployments = deploymentModel;

                            RestService.getProviderContext()
                                .then(function(providerData) {
                                    var _extNetworks = [];
                                    var externalNetwork = {
                                        'id': providerData.context.resources.ext_network.id,
                                        'name': providerData.context.resources.ext_network.name,
                                        'color': getNetworkColor(),
                                        'type': providerData.context.resources.ext_network.type
                                    };
                                    externalNetwork.color = getNetworkColor();
                                    externalNetwork.devices = [
                                        {
                                            'id': providerData.context.resources.router.id,
                                            'name': providerData.context.resources.router.name,
                                            'type': providerData.context.resources.router.type,
                                            'icon': 'router'
                                        }
                                    ];
                                    relations.push({
                                        source: externalNetwork.id,
                                        target: externalNetwork.devices[0].id
                                    });
                                    _extNetworks.push(externalNetwork);

                                    var subNetwork = providerData.context.resources.subnet;
                                    subNetwork.color = getNetworkColor();
                                    relations.push({
                                        source: subNetwork.id,
                                        target: externalNetwork.devices[0].id
                                    });
                                    _extNetworks.push(subNetwork);

                                    $scope.networks = _createNetworkTree(data.plan.nodes, _extNetworks);

                                    console.log(['$scope.networks', $scope.networks]);

                                    bpNetworkService.setMap($scope.networks.relations);
                                    $timeout(function(){
                                        $scope.networkcoords = bpNetworkService.getCoordinates();
                                        bpNetworkService.render();
                                    }, 100);
                                });

                            blueprintCoordinateService.draw();
                        });

                    // Execution
                    RestService.autoPull('getDeploymentExecutions', id, RestService.getDeploymentExecutions)
                        .then(null, null, function (dataExec) {
                            $log.info('data exec', dataExec);
                            if (dataExec.length > 0) {
                                currentExeution = _getCurrentExecution(dataExec);
                                $log.info('current execution is', currentExeution, $scope.deploymentInProgress  );
                                if ( !currentExeution && $scope.deploymentInProgress) { // get info for the first time
                                    $log.info('getting deployment info', isGotExecuteNodes );
                                    if(!isGotExecuteNodes) {
                                        RestService.autoPull('getDeploymentNodes', {deployment_id: id}, RestService.getDeploymentNodes)
                                            .then(null, null, function (dataNodes) {
                                                $scope.nodes = dataNodes.nodes;
                                            });
                                    }
                                    RestService.autoPullStop('getDeploymentNodes');
                                    $scope.deploymentInProgress = false;
                                }
                                else if ($scope.deploymentInProgress === null || currentExeution !== false) {
                                    $scope.deploymentInProgress = true;
                                    RestService.autoPull('getDeploymentNodes', {deployment_id: id}, RestService.getDeploymentNodes)
                                        .then(null, null, function (dataNodes) {
                                            RestService.getNodeInstances()
                                                .then(function(data) {
                                                    dataNodes.forEach(function(node) {
                                                        data.forEach(function(item) {
                                                            if (node.node_instances === undefined) {
                                                                node.node_instances = [];
                                                            }
                                                            if (node.node_id === item.node_id) {
                                                                node.node_instances.push(item);
                                                            }
                                                        });

                                                        $scope.nodes = dataNodes;
                                                        isGotExecuteNodes = true;
                                                    });
                                                    $scope.nodes = dataNodes;
                                                    isGotExecuteNodes = true;
                                                });
                                        });
                                }else{
                                    RestService.getDeploymentNodes({deployment_id : id, state: true}).then(function(dataNodes){
                                        $log.info('loading information for first time');
                                        $scope.nodes = dataNodes;
                                        isGotExecuteNodes = true;
                                        _updateDeploymentModel(dataNodes);
                                    });
                                }
                            }
                        });

                    // Stop pull when leave this view
                    $scope.$on('$destroy', function(){
                        RestService.autoPullStop('getDeploymentExecutions');
                        RestService.autoPullStop('getDeploymentNodes');
                    });
                });
        }

        function _createNodesTree(nodes) {
            var roots = [];
            var nodesIndexedList = [];

            nodes.forEach(function(node) {
                nodesIndexedList[node.id] = node;
            });

            for (var nodeId in nodesIndexedList) {
                var node = nodesIndexedList[nodeId];
                node.class = _getNodeClass(node.type_hierarchy);
                node.isApp = _isAppNode(node);
                node.dataType = _getNodeDataType(node);
                node.state = {
                    total: node.instances.deploy,
                    completed: 0
                };

                if (node.relationships !== undefined && !_isNetworkNode(node)) {
                    for (var i = 0; i < node.relationships.length; i++) {
                        if (node.relationships[i].type_hierarchy.join(',').indexOf('contained_in') > -1) {
                            node.isContained = true;
                            var target_id = node.relationships[i].target_id;
                            if (nodesIndexedList[target_id].children === undefined) {
                                nodesIndexedList[target_id].children = [];
                            }
                            nodesIndexedList[target_id].children.push(node);
                        }
                        if (i === node.relationships.length - 1 && node.isContained === undefined) {
                            node.isContained = false;
                        }
                    }
                    if (!node.isContained) {
                        roots.push(node);
                    }
                } else if(!_isNetworkNode(node) && !node.isContained){
                    roots.push(node);
                }
            }

            return roots.reverse();
        }

        function _isAppNode(node) {
            var networkNodes = [
                'nodejs_app'
            ];

            return networkNodes.indexOf(node.type) > -1;
        }

        function _isNetworkNode(node) {
            var networkNodes = [
                'cloudify.openstack.floatingip',
                'cloudify.openstack.network',
                'cloudify.openstack.port',
                'cloudify.openstack.subnet'
            ];

            return networkNodes.indexOf(node.type) > -1;
        }

        function _getNodeDataType(node) {
            if (!node.isContained && node.children !== undefined) {
                return 'compute';
            } else if (node.isContained && !_isAppNode(node)) {
                return 'middleware';
            } else if (node.isContained && _isAppNode(node)) {
                return 'modules';
            }
        }

        function _getNodeClass(typeHierarchy) {
            for (var i = 0; i < typeHierarchy.length; i++) {
                typeHierarchy[i] = typeHierarchy[i].split('.').join('-').split('_').join('-');
            }
            return typeHierarchy.join(' ');
        }

        function _getCurrentExecution(executions) {
            for(var i in executions) {
                var execution = executions[i];
                if(execution.status !== 'failed' && execution.status !== 'terminated' && execution.status !== 'canceled') {
                    return execution;
                }
            }
            return false;
        }

        // Define Deployment Model in the first time
        function _setDeploymentModel( data ) {
            deploymentModel['*'] = angular.copy(deploymentDataModel);
            for (var nodeId in data.plan.nodes) {
                var node = data.plan.nodes[nodeId];
                if(!deploymentModel.hasOwnProperty(node.name)) {
                    deploymentModel[node.name] = angular.copy(deploymentDataModel);
                }
                deploymentModel['*'].instancesIds.push(node.id);
                deploymentModel['*'].total++;
                deploymentModel[node.name].instancesIds.push(node.id);
                deploymentModel[node.name].total++;
            }
        }

        function _updateDeploymentModel( nodes ) {
            var IndexedNodes = {};
            for (var i in nodes) {
                var node = nodes[i];
                IndexedNodes[node.node_id] = {
                    state: node.state
                };
            }
            for (var d in deploymentModel) {
                var deployment = deploymentModel[d];
                var _reachable = 0;
                var _states = 0;
                var _completed = 0;

                for (var n in deployment.instancesIds) {
                    var nodeId = deployment.instancesIds[n];
                    var nodeInstance = IndexedNodes[nodeId];
                    if(IndexedNodes.hasOwnProperty(nodeId)) {
                        if(nodeInstance.state === 'started') {
                            _reachable++;
                        }
                        if(statesIndex.indexOf(nodeInstance.state) > 0 || statesIndex.indexOf(nodeInstance.state) < 7) {
                            var stateNum = statesIndex.indexOf(nodeInstance.state);
                            if(stateNum === 7) {
                                _completed++;
                            }
                            _states += stateNum;
                        }
                    }
                }
                deployment.completed = _completed;
                deployment.reachables = _reachable;
                deployment.state = Math.round(_states / deployment.total);
                deployment.states = calcState(_states, deployment.total);

                // Calculate percents for progressbar
                var processDone = 0;
                if(deployment.states < 100) {
                    processDone = deployment.states;
                    deployment.process = {
                        'done': deployment.states
                    };
                }
                else {
                    processDone = calcProgress(deployment.reachables, deployment.total);
                    deployment.process = {
                        'done': processDone
                    };
                }

                // Set Status by Workflow Execution Progress
                if($scope.deploymentInProgress) {
                    setDeploymentStatus(deployment, false);
                }
                else {
                    setDeploymentStatus(deployment, processDone);
                }
            }

            nodesList.forEach(function(node) {
                node.state = deploymentModel[node.id];
            });

//            $scope.nodesTree = _createNodesTree(nodesList);

            //$log.info(['deploymentModel', deploymentModel]);
        }

        function setDeploymentStatus(deployment, process) {
            if(process === false) {
                deployment.status = 0;
            }
            else if(process === 100) {
                deployment.status = 1;
            }
            else if(process > 0 && process < 100) {
                deployment.status = 2;
            }
            else if(process === 0) {
                deployment.status = 3;
            }
        }

        function calcState(state, instances) {
            return Math.round(state > 0 ? (state / instances / 7 * 100) : 0);
        }

        function calcProgress(partOf, instances) {
            return Math.round(partOf > 0 ? 100 * partOf / instances : 0);
        }

        // Init
        _loadDeployment();

        // Execution Listener
        $scope.$watch('nodes', function(nodes){
            if(nodes === undefined) {
                return;
            }
            // Update nodes with new data
            _updateDeploymentModel(nodes);
        });

        $scope.$watch('deploymentInProgress', function(){
            _updateDeploymentModel($scope.nodes);
        });

        $scope.getBadgeStatus = function(status) {
            switch(status) {
            case 0:
                return 'install';
            case 1:
                return 'done';
            case 2:
                return 'alerts';
            case 3:
                return 'failed';
            default:
                return 'install';
            }
        };

        $scope.piePercents = function( process ) {
            var value = 0;
            for(var p in process) {
                value += process[p];
            }
            return value;
        };

        /**
         * Side panel
         */

        $scope.$root.$on('topologyNodeSelected', function(e, eventData) {
            RestService.getNodeInstances()
                .then(function(data) {
                    $scope.allNodesArr.forEach(function(node) {
                        data.forEach(function(item) {
                            if (node.node_instances === undefined) {
                                node.node_instances = [];
                            }
                            if (node.id === item.node_id) {
                                node.node_instances.push(item);
                            }
                        });
                    });
//                    $scope.allNodesArr = data;
                    $scope.viewNode(eventData);
                });
        });

        $scope.viewNode = function (node) {
            $scope.showProperties = {
                properties: node.properties,
                relationships: node.relationships,
                general: {
                    'name': node.id,
                    'type': node.type
                }
            };

            _filterSelectionBoxData(node.name);
        };

        function _filterSelectionBoxData(nodeId) {
            $scope.selectNodesArr = [];
            $scope.allNodesArr.forEach(function(node) {
                if (node.id === nodeId) {
                    var _node = {};

                    for (var attr in node) { _node[attr] = node[attr]; }

                    node.node_instances.forEach(function(instance) {
                        for (var attr in instance) { _node[attr] = instance[attr]; }
                    });
                    $scope.selectNodesArr.push(_node);
                }
            });
        }

        $scope.hideProperties = function () {
            $scope.showProperties = null;
        };

        /**
         * Events
         */
        $scope.workflowsList = [];
        $scope.eventTypeList = [];
        $scope.filterLoading = false;
        $scope.eventsFilter = {
            'type': null,
            'workflow': null,
            'nodes': null
        };

        RestService.getWorkflows({deployment_id: id})
            .then(function (data) {
                var workflows = [];
                if (data.hasOwnProperty('workflows')) {
                    for (var wfid in data.workflows) {
                        var wfItem = data.workflows[wfid];
                        workflows.push({'value': wfItem.name, 'label': wfItem.name});
                    }
                }
                $scope.workflowsList = workflows;
            });

        (function eventListForMenu() {
            var eventTypeList = [{'value': null, 'label': 'All'}];
            for(var eventType in EventsMap.getEventsList()) {
                eventTypeList.push({'value': eventType, 'label': EventsMap.getEventText(eventType)});
            }
            $scope.eventTypeList = eventTypeList;
        })();

        var events = EventsService.newInstance('/backend/events'),
            lastNodeSearch = $scope.eventsFilter.nodes;

        $scope.eventsFilter = {
            'type': null,
            'workflow': null,
            'nodes': null
        };

        var lastAmount = 0;
        function executeEvents(autoPull) {
            $scope.filterLoading = true;
            $scope.newEvents = 0;
            $scope.eventHits = [];
            var troubleShoot = 0,
                executeRetry = 10,
                eventsCollect = [];

            function _reverse(array) {
                var copy = [].concat(array);
                return copy.reverse();
            }

            function _convertDates(data) {
                for(var i in data) {
                    data[i]._source.timestamp = $filter('dateFormat')(data[i]._source.timestamp, 'yyyy-MM-dd HH:mm:ss');
                }
                return data;
            }

            events
                .execute(function(data){
                    if(data && data.hasOwnProperty('hits')) {
                        var dataHits = _convertDates(data.hits.hits);
                        if(data.hits.hits.length !== lastAmount) {
                            if(document.body.scrollTop === 0) {
                                $scope.newEvents = 0;
                                $scope.eventHits = _reverse(dataHits);
                            }
                            else {
                                eventsCollect = _reverse(dataHits);
                                $scope.newEvents = eventsCollect.length - $scope.eventHits.length;
                            }
                            lastAmount = dataHits.length;
                        }
                        else if(JSON.stringify($scope.eventHits) === JSON.stringify(_reverse(dataHits))) {
                            $scope.newEvents = 0;
                            $scope.eventHits = _reverse(dataHits);
                        }
                    }
                    else {
                        $log.info('Cant load events, undefined data.');
                        troubleShoot++;
                    }
                    $scope.filterLoading = false;

                    // Stop AutoPull after 10 failures
                    if(troubleShoot === executeRetry) {
                        events.stopAutoPull();
                    }
                }, autoPull);
        }

        function filterEvents(field, newValue, oldValue, execute) {
            if(newValue === null) {
                return;
            }
            if(oldValue !== null && oldValue.value !== null) {
                events.filter(field, oldValue.value);
            }
            if(newValue.value !== null) {
                events.filter(field, newValue.value);
            }
            if(execute === true) {
                executeEvents();
            }
        }

        (function _LoadEvents() {
            filterEvents('type', {value: 'cloudify_event'}, null);
            filterEvents('context.deployment_id', {value: id}, null);
//            filterEvents('context.execution_id', {value: executionIdexecutionId}, null);
            executeEvents(true);
        })();

        $scope.scrollToTop = function(){
            $anchorScroll();
        };

        $scope.$watch('eventsFilter.type', function(newValue, oldValue){
            if(newValue !== null && oldValue !== null) {
                filterEvents('event_type', newValue, oldValue, true);
            }
        });

        $scope.$watch('eventsFilter.workflow', function(newValue, oldValue){
            if(newValue !== null && oldValue !== null) {
                filterEvents('context.workflow_id', newValue, oldValue, true);
            }
        });

        $scope.eventFindNodes = function() {
            if($scope.eventsFilter.nodes === '') {
                $scope.eventsFilter.nodes = null;
            }
            filterEvents('context.node_name', {value: $scope.eventsFilter.nodes}, {value: lastNodeSearch}, true);
            lastNodeSearch = $scope.eventsFilter.nodes;
        };

        $scope.clearFindNode = function() {
            $scope.eventsFilter.nodes = '';
            $scope.eventFindNodes();
        };

        $scope.eventSortList = {};
        $scope.sortEvents = function (field) {
            if (!$scope.eventSortList.hasOwnProperty(field)) {
                $scope.eventSortList[field] = false;
                $scope.eventSortList.current = false;
            }
            if ($scope.eventSortList.current !== field) {
                $scope.eventSortList[field] = false;
            }
            switch ($scope.eventSortList[field]) {
            case false:
                $scope.eventSortList[field] = 'desc';
                break;
            case 'desc':
                $scope.eventSortList[field] = 'asc';
                break;
            case 'asc':
                $scope.eventSortList[field] = false;
                break;
            }
            $scope.eventSortList.current = field;

            // Apply Sort
            events.sort(field, $scope.eventSortList[field]);
            executeEvents();
        };

        $scope.isSorted = function (field) {
            if ($scope.eventSortList.current === field) {
                return $scope.eventSortList[field];
            }
        };

        $scope.viewLogsByEvent = function(event) {
            var logsFilter = {
                'blueprints': [
                    event._source.context.blueprint_id
                ],
                'deployments': [
                    event._source.context.deployment_id
                ],
                'executions': [
                    event._source.context.execution_id
                ],
                'timeframe': [300000],
                'startdate': new Date(event._source.timestamp).getTime()
            };
            $location.url('logs').search('filter', JSON.stringify(logsFilter));
        };

        $scope.viewAllLogs = function() {
            if($scope.eventHits.length > 0) {
                $scope.viewLogsByEvent($scope.eventHits[0]);
            }
        };

        $scope.getNodeById = function(node_id) {
            var _node = {};
            $scope.dataTable.forEach(function(node) {
                if (node.id === node_id) {
                    _node = node;
                }
            });
            return _node;
        };

        // Monitor Mock's
        var graphData = [];
        var graphPages = [];
        $scope.graphs = graphData;
        $scope.graphPages = graphPages;
        $scope.newgraph = {
            name: '',
            type: 'line',
            isArea: 'false'
        };

        function _randerPagination() {
            monitoringGraphs.getPaginationByData(graphPages, graphData, 4);
        }

        function _displayMonitoring(data) {
            for(var i in data) {
                var graph = data[i];
                monitoringGraphs.addGraph(graphData, graph);
                monitoringGraphs.executeQuery(graphData, graph);
                monitoringGraphs.getDirective(graphData, graph);
            }
            _randerPagination();
        }

        if($localStorage.hasOwnProperty('monitoringData')) {
            _displayMonitoring($localStorage.monitoringData);
        }
        else {
            RestService.getMonitorGrpahs()
                .then(function (data) {
                    _displayMonitoring(data);
                });
        }

        $scope.$watch('graphs', function(monitoringData){
            $localStorage.monitoringData = monitoringData;
        }, true);

        $scope.moitorMixColors = ['#E01B5D', '#46b8da'];

        $scope.xAxisTickFormatFunction = function () {
            return function (d) {
                return d3.time.format('%x')(new Date(d));
            };
        };

        $scope.deleteGraph = function (graph) {
            graphData.splice(graphData.indexOf(graph), 1);
        };

        $scope.$on('fireResizeGraph', function() {
            $timeout(function(){
                $(window).trigger('resize');
            }, 1000);
        });

        $scope.addMonitorChart = function() {
            var newMonitorChart = {};
            switch($scope.newgraph.type) {
            case 'line':
                newMonitorChart = {
                    'name': $scope.newgraph.name,
                    'type': 'nvd3-line-with-focus-chart',
                    'query': $scope.newgraph.query,
                    'properties': {
                        'id': 'graphMonitoring'+Math.round(Math.random()*1000),
                        'data': 'graph.data',
                        'xAxisTickFormat': 'xAxisTickFormatFunction()',
                        'x2AxisTickFormat': 'xAxisTickFormatFunction()',
                        'isArea': $scope.newgraph.isArea === 'true' ? true : false
                    }
                };
                break;
            case 'bar':
                newMonitorChart = {
                    'name': $scope.newgraph.name,
                    'type': 'nvd3-multi-bar-chart',
                    'query': $scope.newgraph.query,
                    'properties': {
                        'id': 'graphMonitoring'+Math.round(Math.random()*1000),
                        'data': 'graph.data',
                        'xAxisTickFormat': 'xAxisTickFormatFunction()'
                    }
                };
                break;
            }
            monitoringGraphs.addGraph(graphData, newMonitorChart);
            monitoringGraphs.executeQuery(graphData, newMonitorChart);
            monitoringGraphs.getDirective(graphData, newMonitorChart);
            _randerPagination();
        };

        function getNetworkColor() {
            _colorIdx = _colorIdx < _colors.length ? _colorIdx + 1 : 0;
            return _colors[_colorIdx];
        }
    });
