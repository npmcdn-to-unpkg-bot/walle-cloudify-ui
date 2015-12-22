'use strict';

describe('Filter: dateFormat', function () {
    var dateFormat;
    beforeEach(module('cosmoUiApp', 'ngMock', 'backend-mock'));

    beforeEach(inject(function ($filter) {
        dateFormat = $filter('dateFormat');
    }));

    describe('iso parse with offset', function () {
        it('has a dateFormat filter', function () {
            expect(dateFormat).not.toBeUndefined();
        });

        it('should return the input by requested yyyy-MM-dd HH:mm:ss format', function () {
            var text = '2011-11-24T07:12:12.123+0000';
            var format = 'yyyy-MM-dd HH:mm:ss.sss';
            //Added timezone adjustment just for it to pass on travis / circle and locally
            expect(dateFormat(text, format)).toBe('2011-11-24 0'+(7+new Date().getTimezoneOffset()/-60)+':12:12.123');
        });


        it('should accept only valid format', function () {
            var text = '20111124T090027';
            var timeFormat = 'HH:mm:ss';

            expect(dateFormat(text, timeFormat)).toBe('Invalid date');
        });

        it('it should return undefined if text is undefined', function () {
            expect(dateFormat(undefined)).toBe(undefined);
        });
    });

    describe('iso date without offset', function () {
        beforeEach(function () {
            Date.forceIsoOffset = true;
        });
        it('should give same results ', function () {
            //Added timezone adjustment just for it to pass on travis / circle and locally
            expect(dateFormat('2011-11-24T07:12:12.123+0000', 'yyyy-MM-dd HH:mm:ss.sss')).toBe('2011-11-24 0'+(7+new Date().getTimezoneOffset()/-60)+':12:12.123');
            expect(dateFormat('2011-11-24T07:12:12.123+0000', 'yyyy-MM-dd HH:mm:ss')).toBe('2011-11-24 0'+(7+new Date().getTimezoneOffset()/-60)+':12:12');
        });

        it('should have default date format', function () {
            expect(dateFormat('2011-11-24T07:00:00+0000')).toBe('Nov-24-2011');
        });

        it('support timezones', function () {
            expect(dateFormat('2011-11-24T07:00:00+0300')).toBe('Nov-24-2011');
        });
    });

    describe('rest of formats', function(){
        it('should add timezone to timestamps without', function(){
            expect(dateFormat('2011-11-24 07:59:17.362781', 'yyyy-MM-dd HH:mm:ss.sss')).toBe('2011-11-24 0'+(7+new Date().getTimezoneOffset()/-60)+':59:17.362');
        })
    })
});
