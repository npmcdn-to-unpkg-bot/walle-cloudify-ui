'use strict';

describe('Directive: formRawParams', function () {

    // load the directive's module
    beforeEach(module('cosmoUiApp','backend-mock','templates-main'));

    var element,
        scope;

    beforeEach(inject(function ($compile, $rootScope ) {

        scope = $rootScope.$new();
        scope.onError = jasmine.createSpy('onError');
        scope.valid = false;
        scope.params = [];
        scope.rawString = '';

        element = angular.element('<div form-raw-params on-error="onError(msg)" raw-string="rawString" valid="valid" params="params"></div>');
        element = $compile(element)(scope);
    }));

    it('should update input JSON object when one of the inputs is updated', function () {
        scope.$digest();

        expect(JSON.parse(element.isolateScope().rawString).image_name).not.toBe('new value');

        element.isolateScope().inputs = { image_name : { default : 'new value' } } ;
        element.isolateScope().inputsState = 'raw';

        element.isolateScope().updateInputs();

        expect(JSON.parse(element.isolateScope().rawString).image_name.default).toBe('new value');
    });

    it('should save input type when converting inputs to JSON', function () {

        scope.params = { 'webserver_port' : { default: 80 }, 'bool_variable' : { default: true }, 'str_variable' : { default : 'foo bar' } };
        scope.rawString = JSON.stringify(scope.params, null, 2);
        scope.inputsState = 'raw';

        scope.$digest();

        element.isolateScope().updateInputs();

        expect(typeof(JSON.parse(scope.rawString).webserver_port)).toBe('number');
        expect(typeof(JSON.parse(scope.rawString).bool_variable)).toBe('boolean');
        expect(typeof(JSON.parse(scope.rawString).str_variable)).toBe('string');
    });

    describe('#validateJsonKeys', function () {
        describe('non strict mode', function () {
            beforeEach(function () {
                scope.params = {
                    'foo': 'bar',
                    'hello': 'world'
                };
                scope.$digest();
            });
            it('should return error and false if key is missing', function () {
                element.isolateScope().rawString = JSON.stringify({'foo': 'bar'});

                expect(element.isolateScope().validateJsonKeys()).toBe(false);
                expect(scope.onError).toHaveBeenCalledWith('Missing hello key in JSON');
            });

            it('should return true if all keys exist', function () {
                element.isolateScope().rawString = JSON.stringify({'foo': 'bar', 'hello': 'world'});

                expect(element.isolateScope().validateJsonKeys()).toBe(true);
                expect(scope.onError).toHaveBeenCalledWith(null);
            });
        });

        describe('strict mode', function () {
            beforeEach(function () {
                scope.params = {
                    'foo': 'bar'
                };
                scope.$digest();
            });
            it('should return error and false if key is empty', function () {
                element.isolateScope().rawString = JSON.stringify({'foo': ''});

                expect(element.isolateScope().validateJsonKeys(true)).toBe(false);
                expect(scope.onError).toHaveBeenCalledWith(null);
            });

            it('should return error and false if key is missing', function () {
                element.isolateScope().rawString = JSON.stringify({'foo': undefined , 'unit' : null});

                expect(element.isolateScope().validateJsonKeys(true)).toBe(false);
                expect(scope.onError).toHaveBeenCalledWith(null);
            });
        });
    });

    describe('#validateJSON', function () {
        it('should return false if rawString is an invalid JSON', function () {
            scope.$digest();
            element.isolateScope().rawString = ' { "some" goofy } ';

            expect(element.isolateScope().validateJSON(true)).toBe(false);
            expect(scope.onError).toHaveBeenCalledWith('Invalid JSON: Unable to parse JSON string');
        });
    });

    describe('#rawToForm', function () {
        it('should stringify "1","true" and "null" and not convert them to 1,true,null', function () {
            scope.$digest();
            element.isolateScope().rawString = '{ "foo" : "1", "bar" : "true", "hello" : "null" }';
            element.isolateScope().rawToForm();
            expect(element.isolateScope().inputs.foo).toBe('"1"');
            expect(element.isolateScope().inputs.bar).toBe('"true"');
            expect(element.isolateScope().inputs.hello).toBe('"null"');
        });

        it('should handle invalid raw string and remain in raw mode', inject(function (INPUT_STATE) {
            scope.$digest();
            element.isolateScope().rawString = '{ foo bar }';
            element.isolateScope().rawToForm();
            expect(scope.onError).toHaveBeenCalledWith('Invalid JSON: Unable to parse JSON string');
            expect(element.isolateScope().inputsState).toBe(INPUT_STATE.RAW);
        }));
    });

    describe('views tests', function(){

        var content = null;
        beforeEach(function(){
            var wrapper = angular.element('<div class="ngdialog"><div class="ngdialog-content"></div></div>');
            $('body').append(wrapper);
            content = wrapper.find('.ngdialog-content');
        });

        afterEach(function(){
            $('body .ngdialog').remove();
        });
        describe('overflow', function(){
            function hasScrollbar  (element){
                return element.scrollHeight > element.clientHeight;
            }

            it('should have a scrollbar if overflow',function() {
                scope.params = { 'foo' : '' , 'bar' : '', 'hello' : '', 'world' : '', 'long' : '', 'short' : ''};
                scope.$digest();
                content.append(element);
                var inputParameters = element.find('ul')[0];
                var elementHasScrollbar = hasScrollbar(inputParameters);
                expect(elementHasScrollbar).toBe(true);
            });

            it('should not have a scrollbar if does not overflow',function() {
                scope.params = { 'foo' : '' , 'bar' : '', 'hello' : ''};
                scope.$digest();
                content.append(element);
                var inputParameters = element.find('ul')[0];
                var elementHasScrollbar = hasScrollbar(inputParameters);
                expect(elementHasScrollbar).toBe(false);
            });
        });

        describe('inputs params tooltip', function(){
            var translate;
            beforeEach(inject(function($filter){
                translate = $filter('translate');
            }));

            it('tooltip should show input params description', function(){
                scope.params = { 'foo' : {'description':'A yummy snickers'}};
                scope.$digest();
                content.append(element);
                var inputParameters = element.find('li div');
                expect(inputParameters[0].getAttribute('title')).toBe('A yummy snickers');
            });

            it('tooltip should show no description defined message', function(){
                scope.params = {'bar' : {}};
                scope.$digest();
                content.append(element);
                var inputParameters = element.find('li div');
                expect(inputParameters[0].getAttribute('title')).toBe(translate('formRawParams.noDescriptionTooltip'));
            });
        });

    });
});
