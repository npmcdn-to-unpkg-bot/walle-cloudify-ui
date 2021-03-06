'use strict';

// todo : increase code coverage
describe('Directive: topology', function () {

    // load the directive's module
    beforeEach(module('cosmoUiApp', 'backend-mock', 'templates-main'));

    var element;
    var scope;

    beforeEach(inject(function ($rootScope, $compile) {
        scope = $rootScope.$new();
        spyOn(scope, 'registerTickerTask');
        element = angular.element('<div ui-topology blueprint-id="blueprintId"></div>');
        element = $compile(element)(scope);

    }));

    //TODO: make tests run https://cloudifysource.atlassian.net/browse/CFY-4379
    //describe('init', function(){
    //    it('should load blueprint if id exists', inject(function( cloudifyClient ){
    //        spyOn(cloudifyClient.blueprints,'get').and.returnValue({ then:function(){ }});
    //        scope.blueprintId = 'foo';
    //        scope.$digest();
    //        expect(cloudifyClient.blueprints.get).toHaveBeenCalled();
    //    }));
    //});
    //
    //describe('#onNodeSelected', function(){
    //    it('should call onNodeSelect with specific node', inject(function(cloudifyClient, DataProcessingService) {
    //        //setting nodes mock
    //        var nodesMock = {
    //            data: {
    //                plan:{
    //                    nodes: [
    //                        {
    //                            deployment_plugins_to_install: [],
    //                            host_id: 'host',
    //                            id: 'nodejs',
    //                            instances: {deploy: 1},
    //                            interfaces: {},
    //                            name: 'nodejs',
    //                            nodeType: 'node',
    //                            operations: {},
    //                            plugins: [],
    //                            properties: {},
    //                            relationships: [],
    //                            type: 'nodecellar.nodes.NodeJSServer',
    //                            type_hierarchy: []
    //                        }
    //                    ]
    //                }
    //            }
    //        };
    //        spyOn(DataProcessingService,'encodeTopologyFromRest').and.returnValue({});
    //        spyOn(cloudifyClient.blueprints,'get').and.returnValue(window.mockPromise(nodesMock));
    //        scope.blueprintId = 'foo';
    //        scope.$digest();
    //
    //        //mocking node clicked
    //        var composerNodeMock = {
    //            children:[],
    //            container: {},
    //            height: 160,
    //            hierarchy: [],
    //            id: '14482002209158',
    //            markShifted: false,
    //            markedContainedIn: false,
    //            name: 'nodejs',
    //            templateData: {},
    //            type: 'NodeJSServer',
    //            uiType: 'Node',
    //            width: 210,
    //            x: 355,
    //            y: 80
    //        };
    //        spyOn(element.isolateScope(),'onNodeSelect').and.callThrough();
    //        element.isolateScope().onNodeSelected(composerNodeMock);
    //
    //        expect(element.isolateScope().onNodeSelect).toHaveBeenCalledWith({node: nodesMock.data.plan.nodes[0]});
    //    }));
    //});
});
