'use strict';

describe('Controller: DeploymentsCtrl', function () {
    var DeploymentsCtrl, scope;

    beforeEach(module('cosmoUiApp', 'templates-main', 'backend-mock'));

    function _testSetup() {
        inject(function ($controller, $rootScope, $httpBackend, $q, cloudifyClient) {

            scope = $rootScope.$new();

            spyOn(cloudifyClient.executions,'list').and.callFake(function(){
                return {
                    then:function(/*success,error*/){}
                };
            });

            spyOn(cloudifyClient.deployments,'list').and.callFake(function(){
                return {
                    then: function (success/*, error*/) {
                        success({ data: []});
                    }
                };
            });

            spyOn(cloudifyClient.blueprints,'list').and.callFake(function () {
                return {
                    then:function(success){
                        success( { data : {} } );
                    }
                };
            });

            DeploymentsCtrl = $controller('DeploymentsCtrl', {
                $scope: scope
            });

            scope.$digest();
        });
    }

    describe('#loadExecutions', function(){

        var loadExecutions = null;
        var executions = null;

        beforeEach(inject(function( cloudifyClient, ExecutionsService, TickerSrv  ){

            spyOn(TickerSrv,'register').and.callFake(function( name, callback ){
                if ( name === 'deployments/loadExecutions' ){
                    loadExecutions = callback;

                }
            });

            _testSetup();
            executions = [{'deployment_id' : 'foo', name : 'bar', is_running: true }];
            cloudifyClient.executions.list.and.returnValue( window.mockPromise( { data : {items: executions  }} ));
        }));

        it('should get only running executions', inject(function(cloudifyClient) {
            var expectedParameters = {
                _include: 'id,workflow_id,status,deployment_id',
                status: ['pending', 'started', 'cancelling', 'force_cancelling']
            };

            loadExecutions();

            expect(cloudifyClient.executions.list).toHaveBeenCalledWith(expectedParameters);
        }));
    });

    describe('managerError', function () {
        it('should be initialized to empty string', function () {
            _testSetup();
            expect(scope.managerError).toBe('');
        });
    });

    describe('isExecuting', function () {
        it('should return true if something is executing', function () {
            _testSetup();
            expect(scope.isExecuting()).toBe(false);
        });
    });

    describe('canPause', function(){
        it('should call ExecutionsService.canPause', inject(function(ExecutionsService){
            _testSetup();
            spyOn(ExecutionsService,'canPause');
            spyOn(scope,'getExecution');
            scope.canPause('foo');
            expect(scope.getExecution).toHaveBeenCalled();
            expect(ExecutionsService.canPause).toHaveBeenCalled();
        }));
    });


    describe('Controller tests', function () {

        it('should create a controller', function () {
            _testSetup();
            expect(DeploymentsCtrl).not.toBeUndefined();
        });

        it('should load deployment executions every X (>0) milliseconds', inject(function ($httpBackend, TickerSrv) {
            _testSetup();

            var loadExecutionRegistered = false;
            var handler = null;
            var interval = 0;

            spyOn(TickerSrv, 'register').and.callFake(function(id, _handler, _interval/*, delay, isLinear*/) {
                if ( id === 'deployments/loadExecutions' ){
                    loadExecutionRegistered = true;
                    handler = _handler;
                    interval = _interval;
                }

                expect(loadExecutionRegistered).toBe(true);
                expect(typeof(handler)).toBe('function');
                expect(handler.toString().indexOf('cloudifyClient.executions') >= 0).toBe(true);
                expect(interval > 0).toBe(true);

            });


        }));



    });
});
