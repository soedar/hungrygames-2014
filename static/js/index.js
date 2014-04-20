var index = angular.module('index', ['ui.bootstrap']);

index.controller('indexController', function($scope, $http) {
    var indexData = [];

    var qual_1 = {'name': 'Qualifier 1',
    'highlight': 2,
    'matchfile': 'quals_1/matches.json'
    };

    var qual_2 = {'name': 'Qualifier 2',
    'highlight': 2,
    'matchfile': 'quals_2/matches.json'
    };

    var finals = {'name': 'Finals',
    'highlight': 3,
    'matchfile': 'finals/matches.json'
    };

    indexData.push(qual_1);
    indexData.push(qual_2);
    indexData.push(finals);


// Should not modify anything below

    fetchIndexData(0, indexData);

    function fetchIndexData(i, indexData) {
        if (i >= indexData.length) {
            $scope.indexData = indexData;
        } else {
            $http.get('games/' + indexData[i].matchfile).success(function(data) {
                indexData[i].data = splitData(data);
                fetchIndexData(i+1, indexData);
            }).error(function() {
                fetchIndexData(i+1, indexData);
            });
        }
    }

    function splitData(data) {
        var grouped_data = [];

        var group = [];
        for (var i=0;i<data.length;i++) {
            if (i > 0 && i % 3 == 0) {
                grouped_data.push(group);
                group = [];
            }
            group.push(data[i]);
        }
        if (group.length > 0) {
            grouped_data.push(group);
        }
        return grouped_data;
    }
});
