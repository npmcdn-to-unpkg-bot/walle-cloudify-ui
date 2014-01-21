'use strict';

angular.module('cosmoUi', ['gsUiInfra', 'angularFileUpload', 'ngCookies', 'ngRoute','ngSanitize', 'ngBreadcrumbs'])
    .config(function ($routeProvider) {
        var isSettingsExists = window.isSettingsExists();

        $routeProvider
            .when('/json', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .when('/blueprints', {
                templateUrl: 'views/blueprintsIndex.html',
                controller: 'BlueprintsIndexCtrl'
            })
            .when('/blueprint',{
                templateUrl: 'views/plans.html',
                controller: 'PlansCtrl'
            })
            .when('/deployments',{
                templateUrl: 'views/deployments.html',
                controller: 'DeploymentsCtrl'
            })
            .when('/deployment',{
                templateUrl: 'views/deployment.html',
                controller: 'DeploymentCtrl'
            })
//            .when('/events',{
//                templateUrl: 'views/events.html',
//                controller: 'EventsCtrl'
//            })
            .when('/monitoring',{
                templateUrl: 'views/blueprintsIndex.html'
            })
            .when('/logs',{
                templateUrl: 'views/blueprintsIndex.html'
            })
            .when('/hosts',{
                templateUrl: 'views/blueprintsIndex.html'
            })
            .when('/networks',{
                templateUrl: 'views/blueprintsIndex.html'
            })
            .when('/floating-ips',{
                templateUrl: 'views/blueprintsIndex.html'
            })
            .when('/storage',{
                templateUrl: 'views/blueprintsIndex.html'
            })
            .when('/config', {
                templateUrl: 'views/config.html',
                controller: 'ConfigCtrl'
            })
            .otherwise({
                redirectTo: isSettingsExists ? '/blueprints' : '/config'
            });
    });
