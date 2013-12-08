'use strict';

angular.module('cosmoUi', ['gsUiInfra', 'angularFileUpload', 'ngCookies'])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/json', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .when('/blueprints', {
                templateUrl: 'views/plansIndex.html',
                controller: 'PlansIndexCtrl'
            })
            .when('/blueprint',{
                templateUrl: 'views/plans.html',
                controller: 'PlansCtrl'
            })
            .when('/running-apps',{
                templateUrl: 'views/plans.html'
            })
            .when('/events',{
                templateUrl: 'views/events.html',
                controller: 'EventsCtrl'
            })
            .when('/monitoring',{
                templateUrl: 'views/plans.html'
            })
            .when('/logs',{
                templateUrl: 'views/plans.html'
            })
            .when('/hosts',{
                templateUrl: 'views/plans.html'
            })
            .when('/networks',{
                templateUrl: 'views/plans.html'
            })
            .when('/floating-ips',{
                templateUrl: 'views/plans.html'
            })
            .when('/storage',{
                templateUrl: 'views/plans.html'
            })
            .otherwise({
                redirectTo: '/blueprints'
            });
    });
