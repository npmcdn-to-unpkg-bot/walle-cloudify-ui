'use strict';

/**
 * @ngdoc service
 * @name cosmoUiApp.cloudifyClient
 * @description
 * # cloudifyClient
 * Factory in the cosmoUiApp.
 */
angular.module('cosmoUiApp')
    .factory('cloudifyClient', function (CloudifyClient, $http, $q) {
        var client =  new CloudifyClient({
            'endpoint': '/backend/cloudify-api',
            request: function (opts, callback) {
                if (!callback) {
                    callback = function () {
                    }; // noop
                }

                if (opts.body) {
                    opts.data = opts.body;
                }

                opts.params = opts.qs;

                // add support to json headers. required by REST.
                // follow recommendation by cloudify-js project.
                if (!!opts.json) {
                    opts.headers = _.merge({}, opts.headers, {'Content-Type': 'application/json'});
                }

                //sending FormData object as body, preventing $http from serializing it.
                if(opts.data instanceof FormData){
                    opts.transformRequest = angular.identity;
                    opts.headers = {'Content-Type': undefined};
                }

                return $http(opts).then(function (result) {
                    callback(null, result, result ? result.data : null);
                    return result;
                }, function (result) {
                    callback(null, result);
                    return $q.reject(result);
                });
            }
        });

        client.executions.getRunningExecutions = function(opts){
            var statusFilter = ['pending', 'started', 'cancelling', 'force_cancelling'];
            opts.status = statusFilter;
            return client.executions.list(opts);
        };

        return client;
    });
