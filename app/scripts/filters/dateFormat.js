'use strict';

angular.module('cosmoUi')
    .filter('dateFormat', function myDateFormat($filter) {
        return function (text, newformat) {
            var tempdate = new Date(text.replace(/-/g, '/'));
            return $filter('date')(tempdate, newformat ? newformat : 'MMM-dd-yyyy');
        };
    });