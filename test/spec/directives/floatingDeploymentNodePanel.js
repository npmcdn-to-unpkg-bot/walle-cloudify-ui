'use strict';

describe('Directive: floatingDeploymentNodePanel', function () {
    var element, scope, isolateScope;
    var _nodeInstance = {
        'relationships': [{
            'target_name': 'nodecellar_security_group',
            'type': 'cloudify.openstack.server_connected_to_security_group',
            'target_id': 'nodecellar_security_group_b0cec'
        }, {
            'target_name': 'nodecellar_floatingip',
            'type': 'cloudify.openstack.server_connected_to_floating_ip',
            'target_id': 'nodecellar_floatingip_9cfed'
        }],
        'runtime_properties': {
            'cloudify_agent': {
                'user': 'ubuntu'
            },
            'resource_id': '',
            'ip': '1.1.1.1',
            'management_network_name': '',
            'server': {
                'image': '75d47d10-fef8-473b-9dd1-fe2f7649cb41',
                'flavor': 101,
                'security_groups': ['node_cellar_security_group']
            }
        },
        'node_id': 'nodejs_host',
        'version': null,
        'state': 'started',
        'host_id': 'nodejs_host_b86e1',
        'deployment_id': 'nc1_dep1',
        'id': 'nodejs_host_b86e1'
    };

    var _nodes = [{
        'deploy_number_of_instances': '1',
        'type_hierarchy': ['cloudify-nodes-Root', 'cloudify-nodes-SoftwareComponent', 'cloudify-nodes-DBMS', 'nodecellar-nodes-MongoDatabase'],
        'blueprint_id': 'nodecellar1',
        'host_id': 'mongod_host',
        'type': 'nodecellar.nodes.MongoDatabase',
        'id': 'mongod',
        'number_of_instances': '1',
        'deployment_id': 'nc1_dep1',
        'planned_number_of_instances': '1',
        'name': 'mongod',
        'class': 'cloudify-nodes-Root cloudify-nodes-SoftwareComponent cloudify-nodes-DBMS nodecellar-nodes-MongoDatabase',
        'isApp': false,
        'isHost': false,
        'isContained': true,
        'dataType': 'middleware'
    }, {
        'deploy_number_of_instances': '1',
        'type_hierarchy': ['cloudify-nodes-Root', 'cloudify-nodes-Compute', 'cloudify-openstack-nodes-Server', 'nodecellar-nodes-MonitoredServer'],
        'blueprint_id': 'nodecellar1',
        'host_id': 'mongod_host',
        'type': 'nodecellar.nodes.MonitoredServer',
        'id': 'nodejs_host',
        'number_of_instances': '1',
        'deployment_id': 'nc1_dep1',
        'planned_number_of_instances': '1',
        'name': 'nodejs_host',
        'class': 'cloudify-nodes-Root cloudify-nodes-Compute cloudify-openstack-nodes-Server nodecellar-nodes-MonitoredServer',
        'isApp': false,
        'isHost': true,
        'isContained': false,
        'dataType': 'compute'
    }];

    beforeEach(module('cosmoUiApp', 'ngMock', 'templates-main'));

    describe('Test setup', function() {
        it ('', inject(function ($compile, $rootScope, $httpBackend) {
            $httpBackend.whenGET('/backend/configuration?access=all').respond(200);
            $httpBackend.whenGET('/backend/versions/ui').respond(200);
            $httpBackend.whenGET('/backend/versions/manager').respond(200);
            $httpBackend.whenGET('/backend/version/latest?version=00').respond('300');

            scope = $rootScope.$new();
            element = $compile(angular.element('<div floating-deployment-node-panel node="node" depid="deploymentId"></div>'))(scope);

            $rootScope.$apply();

            scope = element.isolateScope();
            isolateScope = element.children().scope();

            scope.$apply();
        }));
    });

    describe('Directive tests', function() {
        beforeEach(function() {
            scope = element.isolateScope();
            scope.nodesList = _nodes;
            scope.showProperties = undefined;
        });

        it('should create an element with nodeSelected function', function() {
            expect(typeof(scope.nodeSelected)).toBe('function');
        });

        it('should create showProperties object with runtime properties', function() {
            scope.nodeSelected(_nodeInstance);

            waitsFor(function() {
                return scope.showProperties !== undefined;
            });
            runs(function() {
                expect(scope.showProperties.properties).toBeDefined();
                expect(scope.showProperties.properties.ip).toBe('1.1.1.1');
                expect(scope.showProperties.general.state).toBe('started');
            });
        });

        it('should show panel when node is set', function() {
            scope.node = _nodeInstance;

            scope.$apply();

            expect(isolateScope.showPanel).toBe(true);
        });

        it('should hide panel when node is set to null', function() {
            scope.node = null;

            scope.$apply();

            expect(isolateScope.showPanel).toBe(false);
        });

        it('should return public IPs instead of public ip\'s', function() {
            expect(scope.getPropertyKeyName('ip_addresses')).toBe('public IPs');
        });

        it('should create showProperties object with node type (CFY-2428)', function() {
            scope.nodeSelected(_nodeInstance);

            waitsFor(function() {
                return scope.showProperties !== undefined;
            });
            runs(function() {
                expect(scope.showProperties.general.type).toBe('nodecellar.nodes.MonitoredServer');
            });
        });
    });
});
