'use strict';

angular.module('cosmoUi')
    .controller('DeploymentCtrl', function ($scope, $rootScope, $cookieStore, $routeParams, RestService, EventsService, BreadcrumbsService, YamlService, PlanDataConvert, blueprintCoordinateService, bpNetworkService, $location, $anchorScroll, $timeout) {

        var totalNodes = 0,
            deploymentModel = {},
            statesIndex = ['uninitialized', 'initializing', 'creating', 'created', 'configuring', 'configured', 'starting', 'started'];


        var deploymentDataModel = {
            'status': 0, // 0 = (install) in progress, 1 = (done) all done and reachable, 2 = (alert) all done but half reachable, 3 = (failed) all done and not reachable
            'reachables': 0,
            'states': 0,
            'completed': 0,
            'total': 0,
            'process': 0,
            'instancesIds': []
        };

        var planData/*:PlanData*/ = null;
        $scope.deployment = null;
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

        var eventCSSMap = {
            'workflow_received': {text: 'Workflow received', icon: 'event-icon-workflow-started', class: 'event-text-green'},
            'workflow_started': {text: 'Workflow started', icon: 'event-icon-workflow-started', class: 'event-text-green'},
            'workflow_initializing_policies': {text: 'Workflow initializing policies', icon: 'event-icon-workflow-started', class: 'event-text-green'},
            'workflow_initializing_node': {text: 'Workflow initializing node', icon: 'event-icon-workflow-started', class: 'event-text-green'},
            'workflow_success': {text: 'Workflow end successfully', icon: 'event-icon-workflow-end-successfully', class: 'event-text-green'},
            'workflow_failed': {text: 'Workflow failed', icon: 'event-icon-workflow-failed', class: 'event-text-red'},
            'workflow_stage': {text: 'Workflow Stage', icon: 'event-icon-task-sent', class: 'event-text-green'},
            'task_started': {text: 'Task started', icon: 'event-icon-task-started', class: 'event-text-green'},
            'sending_task': {text: 'Task sent', icon: 'event-icon-task-sent', class: 'event-text-green'},
            'task_received': {text: 'Task received', icon: 'event-icon-task-sent', class: 'event-text-green'},
            'task_succeeded': {text: 'Task end successfully', icon: 'event-icon-task-success', class: 'event-text-green'},
            'task_failed': {text: 'Task failed', icon: 'event-icon-task-failed', class: 'event-text-red'},
            'policy_success': {text: 'Policy end successfully started', icon: 'event-icon-policy-success', class: 'event-text-green'},
            'policy_failed': {text: 'Policy failed', icon: 'event-icon-policy-failed', class: 'event-text-red'}
        };
        var id = $routeParams.id;
        var blueprintId = $routeParams.blueprintId;
        //var from = 0;
        //var to = 5;

        BreadcrumbsService.push('deployments',
            {
                href: '#/deployments?blueprint_id=' + blueprintId,
                label: blueprintId,
                id: 'deployment_id'
            });

        BreadcrumbsService.push('deployments',
            {
                href: '#/deployment?id=' + id,
                label: id,
                id: 'deployment'
            });

        $scope.getEventClass = function(event) {
            return _getCssMapField( event, 'class');
        };

        $scope.getEventIcon = function(event) {
            if(eventCSSMap.hasOwnProperty(event)) {
                return eventCSSMap[event].icon;
            }
        };

        $scope.getEventText = function(event) {
            if(eventCSSMap.hasOwnProperty(event)) {
                return eventCSSMap[event].text;
            }
            return event;
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

        function _getCssMapField( event, field ){
            var eventMapping = getEventMapping(event);
            if ( !!eventMapping && eventCSSMap.hasOwnProperty(eventMapping) ){
                return eventCSSMap[eventMapping][field];
            } else {
                console.log([event, 'does not have field', field]);
                return '';
            }
        }

        $scope.nodeSelected = function(node) {
            $scope.selectedNode = node;
            $scope.showProperties = {
                properties: node.properties,
                relationships: node.relationships,
                general: {
                    'name': node.id,
                    'type': node.type,
                    'reachable': $scope.getNodeStateData(node.id).reachable,
                    'state': $scope.getNodeStateData(node.id).state
                }
            };
        };

        $scope.getNodeStateData = function(nodeId) {
            for(var i = 0; i < $scope.nodes.length; i++) {
                if ($scope.nodes[i].id === nodeId) {
                    return $scope.nodes[i];
                }
            }
        };

        function getEventMapping(event) {
            var eventMap;

            if (event.type === 'policy') {
                if (event.policy === 'start_detection_policy') {
                    eventMap = 'policy_success';
                } else if (event.policy === 'failed_detection_policy') {
                    eventMap = 'policy_failed';
                }
            } else if (event.type === 'workflow_stage') {
                if (event.stage.indexOf('Loading blueprint') !== -1) {
                    eventMap = 'workflow_started';
                } else if (event.stage.indexOf('executed successfully') !== -1) {
                    eventMap = 'workflow_success';
                } else if (event.stage.indexOf('Initializing monitoring policies') !== -1) {
                    eventMap = 'workflow_initializing_policies';
                } else if (event.stage.indexOf('Initializing node') !== -1) {
                    eventMap = 'workflow_initializing_node';
                }
            } else if (eventCSSMap[event.type] !== undefined) {
                eventMap = event.type;
            }

            return eventMap !== undefined ? eventMap : event.type;
        }

        function _drawPlan( dataPlan ) {
            var dataMap;

            /**
             * Networks
             */
                // Filter data for Networks
            PlanDataConvert.nodesToNetworks(dataPlan);
            $scope.networks = dataPlan.network;
            bpNetworkService.setMap(dataPlan.network.relations);

            // Render Networks
            $timeout(function(){
                $scope.networkcoords = bpNetworkService.getCoordinates();
                bpNetworkService.render();
            }, 1500);

            /**
             * Blueprint
             */
            // Convert edges to angular format
            if (dataPlan.hasOwnProperty('edges') && !!dataPlan.edges) {
                dataMap = PlanDataConvert.edgesToBlueprint(dataPlan.edges);
            }

            // Index data by ID
            if (dataPlan.hasOwnProperty('nodes') && !!dataPlan.nodes) {
                totalNodes = 0;
                $scope.indexNodes = {};
                dataPlan.nodes.forEach(function (node) {
                    $scope.indexNodes[node.id] = node;
                    totalNodes++;
                });
            }

            // Set Map
            blueprintCoordinateService.setMap(dataMap['cloudify.relationships.connected_to']);

            // Connection between nodes
            $scope.map = dataMap['cloudify.relationships.contained_in'];
            $scope.coordinates = blueprintCoordinateService.getCoordinates();
            $scope.deployments = deploymentModel;
        }

        function _loadDeployment() {
            RestService.getDeploymentById({deploymentId : id})
                .then(function(deploymentData) {
                    // Set Deployment Model
                    _setDeploymentModel(deploymentData);

                    $scope.allNodesArr = deploymentData.plan.nodes;

                    // Blueprint
                    RestService.getBlueprintById({id: deploymentData.blueprintId})
                        .then(function(data){
                            YamlService.loadJSON(id, data, function(err, data){
                                planData = data;
                                // Draw Blueprint Plan
                                _drawPlan(data.getJSON());
                            });
                        });

                    // Execution
                    RestService.getDeploymentNodes({deploymentId : id, state: true})
                        .then(null, null, function(dataNodes) {
                            $scope.nodes = dataNodes;
                        });
                });
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
                IndexedNodes[node.id] = {
                    reachable: node.reachable,
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
                        if(nodeInstance.reachable) {
                            _reachable++;
                        }
                        if(statesIndex.indexOf(nodeInstance.state) > 0 || statesIndex.indexOf(nodeInstance.state) < 7) {
                            var stateNum = statesIndex.indexOf(nodeInstance.state);
                            if(stateNum === 6) {
                                _completed++;
                            }
                            _states += stateNum;
                        }
                    }
                }
                deployment.completed = _completed;
                deployment.reachables = _reachable;
                deployment.states = calcState(_states, deployment.total);

                // Calculate percents for progressbar
                var processDone = 0;
                if(deployment.states < 100) {
                    processDone = deployment.states;
                    deployment.process = {
                        'done': deployment.states,
                        'failed': 0
                    };
                    deployment.status = 0;
                }
                else {
                    processDone = calcProgress(deployment.reachables, deployment.total);
                    if(processDone === 100) {
                        deployment.status = 1;
                    }
                    else if(processDone > 0 && processDone < 100) {
                        deployment.status = 2;
                    }
                    else if(processDone === 0) {
                        deployment.status = 3;
                    }
                    deployment.process = {
                        'done': processDone,
                        'failed': 100 - processDone
                    };
                }
            }
            //console.log(["deploymentModel", deploymentModel]);
        }

        function calcState(state, instances) {
            return Math.round(state > 0 ? (state / instances / 6 * 100) : 0);
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
        }, true);

        // TODO: return the right status by formula, need to ask Yaron or Guy
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

        // Get Icon by Type
        $scope.getIcon = function (type) {
            switch (type) {
            case 'server':
                return 'app-server';
            case 'host':
                return 'host';
            }
        };

        /**
         * Side panel
         */
        $scope.viewNode = function (node) {
            var realNode = planData.getNode(node.id);
            $scope.showProperties = {
                properties: planData.getProperties(realNode),
                relationships: planData.getRelationships(realNode),
                general: planData.getGeneralInfo(realNode)
            };

            _filterSelectionBoxData(realNode.name);
        };

        function _filterSelectionBoxData(nodeId) {
            $scope.selectNodesArr = [];
            for (var i = 0; i < $scope.allNodesArr.length; i++) {
                if ($scope.allNodesArr[i].name === nodeId) {
                    $scope.selectNodesArr.push($scope.allNodesArr[i]);
                }
            }
            $scope.nodeSelected($scope.selectNodesArr[0]);
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

        RestService.getWorkflows({deploymentId: id})
            .then(function (data) {
                var workflows = [{'value': null, 'label': 'All'}];
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
            for(var eventType in eventCSSMap) {
                var eventItem = eventCSSMap[eventType];
                eventTypeList.push({'value': eventType, 'label': eventItem.text});
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

        function executeEvents(autoPull) {
            $scope.filterLoading = true;
            $scope.newEvents = 0;
            $scope.eventHits = [];
            var troubleShoot = 0,
                executeRetry = 10,
                lastAmount = 0,
                eventsCollect = [];

            function _reverse(array) {
                var copy = [].concat(array);
                return copy.reverse();
            }

            events
                .execute(function(data){
                    if(data && data.hasOwnProperty('hits')) {
                        if(data.hits.hits.length !== lastAmount) {
                            if(document.body.scrollTop === 0) {
                                $scope.newEvents = 0;
                                $scope.eventHits = _reverse(data.hits.hits);
                            }
                            else {
                                eventsCollect = _reverse(data.hits.hits);
                                $scope.newEvents = eventsCollect.length - $scope.eventHits.length;
                            }
                            lastAmount = data.hits.hits.length;
                        }
                    }
                    else {
                        console.warn('Cant load events, undefined data.');
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

    });