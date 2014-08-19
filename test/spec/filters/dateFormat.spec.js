'use strict';

describe('Filter: dateFormat', function () {
    var dateFormat;

    describe('Test setup', function() {
        it('Injecting required data & initializing a new instance', function() {
            // load the filter's module
            module('cosmoUiApp', 'ngMock');

            // initialize a new instance of the filter
            inject(function ($filter) {
                dateFormat = $filter('dateFormat');
            });
        });
    });

    describe('Unit tests', function() {
        it('has a dateFormat filter', function(){
            expect(dateFormat).not.toBeUndefined();
        });

        it('should return the input by requested yyyy-MM-dd HH:mm:ss format', function() {
            var text = '2011-11-24T09:00:27+0200';
            var format = 'yyyy-MM-dd HH:mm:ss';

            expect(dateFormat(text, format)).toBe('2011-11-24 09:00:27');
        });

        it('should accept only valid format', function() {
            var text = '20111124T090027';
            var timeFormat = 'HH:mm:ss';

            expect(dateFormat(text, timeFormat)).toBe('NaN:NaN:NaN');
        });
    });
});
