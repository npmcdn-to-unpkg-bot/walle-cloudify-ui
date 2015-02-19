'use strict';

angular.module('cosmoUiApp')
    .controller('InterfaceCtrl', function ($scope, BreadcrumbsService, topologyTypes, EventsMap, nodeStatus) {

        /**
         * Breadcrumbs
         */
        BreadcrumbsService.push('interface', {
            href: '#/interface',
            i18nKey: 'breadcrumb.interface',
            id: 'interface'
        });

        $scope.typesList = topologyTypes.getList();

        $scope.eventsList = EventsMap.getEventsList();

        $scope.nodeStatusList = nodeStatus.getStatuses();

    });
