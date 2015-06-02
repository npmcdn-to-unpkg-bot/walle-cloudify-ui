'use strict';

describe('Service: DeploymentsService', function () {

    var mDeploymentsService;

    describe('Test setup', function() {
        it('Injecting required data & initializing a new instance', function() {

            // Load the app module
            module('cosmoUiApp', 'gsUiHelper', function ($translateProvider) {
                $translateProvider.translations('en', {});
            });

            // Initialize a new instance of DeploymentsService
            inject(function (DeploymentsService) {
                mDeploymentsService = DeploymentsService;
            });

        });
    });

    describe('Unit tests', function() {

        it('should create a new DeploymentsService instance', function() {
            expect(mDeploymentsService).not.toBeUndefined();
        });

        it('should have execute method', function(){
            expect(mDeploymentsService.execute).not.toBeUndefined();
        });

        beforeEach(function(){
            spyOn(mDeploymentsService, 'execute');
            mDeploymentsService.execute();
        });

        it('tracks that the spy was called execute', function() {
            expect(mDeploymentsService.execute).toHaveBeenCalled();
        });

        it('tracks its number of execute calls', function() {
            expect(mDeploymentsService.execute.calls.length).toEqual(1);
        });

    });

});
