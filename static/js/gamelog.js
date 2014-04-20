var gameLogViewer = angular.module('gameLogViewer', ['ui.bootstrap']).config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
}]);

gameLogViewer.controller('GetLogController', function($scope, $http, $location) {
    function loadPageData(data) {
        $scope.gameLog = data;
        $scope.roundsInfo = [];

        for (var i=0;i<$scope.gameLog.rounds.length;i++) {
            $scope.roundsInfo.push({header: 'Round ' + (i+1), 
                                    history: $scope.gameLog.rounds[i].history, 
                                    scores: $scope.gameLog.rounds[i].scores,
                                    config: $scope.gameLog.rounds[i].config,
                                    page: 1,
                                    collaspe: true});
        }

        var tributes = [];
        var maxScore = -1;
        var winners = [];
        for (var tribute in $scope.gameLog.scores) {
            tributes.push(tribute);

            if ($scope.gameLog.scores[tribute] == maxScore) {
                winners.push(tribute);
            }
            else if ($scope.gameLog.scores[tribute] > maxScore) {
                winners = [tribute];
                maxScore = $scope.gameLog.scores[tribute];
            }
        }
        tributes.sort();
        winners.sort();

        $scope.gameLog.tributes = tributes;
        $scope.gameLog.winners = winners;

    }
    
    var game = $location.search().game;

    if (game) {
        $http.get('games/' + game).success(function(data) {
            loadPageData(data);
        });
    }

    $scope.set_selected_time = function(time) {
        $scope.selectedTurn = time;
    }
}).directive('eventHistory', function($compile) {
    function objectify(object) {
        return "<span object data='"+ JSON.stringify(object) + "'></span>";
    }

    function str_arr(arr) {
        var str = '(';
        arr.forEach(function(item) {
            str += item + ', ';
        });
        str = str.slice(0, -2) + ')';

        return str;
    }

    function stringifyEvent(event) {
        stringify = {
            'MOVE': function(args) {
                var object = args[0],
                old_place = args[1],
                new_place = args[2];
                return objectify(object) + " moved from " + objectify(old_place) + " to " + objectify(new_place);
            },
            'TOOK': function(args) {
                var object = args[0],
                item = args[1];
                return objectify(object) + " took " + objectify(item);
            },
            'ATE': function(args) {
                var object = args[0],
                item = args[1];
                return objectify(object) + " ate " + objectify(item);
            },
            'ATTACK': function(args) {
                var object = args[0],
                enemy = args[1],
                damage = args[2];

                return objectify(object) + " attacked " + objectify(enemy) + " (" + damage + " dmg)";
            },
            'DEAD': function(args) {
                var object = args[0];

                return "";
                return objectify(object) + " died!";
            },
            'INPUT': function(args) {
                var object = args[0];

                var action = [];
                for (var i=0;i<args[1].length;i++) {
                    element = args[1][i];

                    if (element.name) {
                        action.push(objectify(element));
                    }
                    else {
                        action.push(element);
                    }
                }

                return "<i class='fa fa-gamepad'></i> " + objectify(object) + ": " + str_arr(action);
            },
            'INPUT_ERROR': function(args) {
                var object = args[0];
                var error = args[1];

                return "<i class='fa fa-warning'></i> " + objectify(object) + " raised an exception: " + error;
            },
            'KILLED': function(args) {
                var killer = args[0];
                var killed = args[1];

                return objectify(killer) + " killed " + objectify(killed);
            },
            'SPAWNED': function(args) {
                var spawned = args[0];

                return "<i class='fa fa-exclamation'></i> " + objectify(spawned) + " <b>spawned</b>!";
            },
            'SURVIVED': function(args) {
                var survivor = args[0];

                return "<i class='fa fa-trophy fa-lg'></i> " + objectify(survivor) + " survived!";
            },
            'STARVED': function(args) {
                var starved = args[0];

                return objectify(starved) + " starved to death!";
            }
        }
        if (event[0] in stringify) {
            return stringify[event[0]](event.slice(1))
        }
        return JSON.stringify(event);
    }

    return {
        scope: true,
        link: function(scope, element, attrs) {
            var el;

            attrs.$observe('event', function(evt) {
                evt = stringifyEvent(JSON.parse(evt));
                evt = '<div>' + evt + '</div>';
                el = $compile(evt)(scope);

                element.html("");
                element.append(el);
            });
        }
    };
}).directive('object', function($compile) {
    function htmlOfObject(obj) {
        function row(key, value) {
            return "<b>" + key + ": </b>" + value + "<br>";
        }

        function str_arr(arr) {
            var str = '[';
            arr.forEach(function(item) {
                str += item.name + ', ';
            });
            str = str.slice(0, -2) + ']';

            return str;
        }

        if (!obj.type) {
            return '';
        }

        var objString = row(obj.name, obj.type);

        if (obj.health != null) {
            objString += row("Health", obj.health);
        }
        if (obj.hunger != null) {
            objString += row("Hunger", obj.hunger);
        }
        if (obj.min_dmg != null && obj.max_dmg != null) {
            objString += row("Damage", obj.min_dmg + "-" + obj.max_dmg);
        }
        if (obj.damage != null) {
            objString += row("Damage", obj.damage);
        }
        if (obj.shots_left != null) {
            objString += row("Shots left", obj.shots_left);
        }
        if (obj.food_value != null) {
            objString += row("Food value", obj.food_value);
        }
        if (obj.medicine_value != null) {
            objString += row("Medicine value", obj.medicine_value);
        }

        if (obj.inventory != null && obj.inventory.length > 0) {
            objString += row("Inventory", str_arr(obj.inventory));
        }
        if (obj.objects != null && obj.objects.length > 0) {
            objString += row("Objects", str_arr(obj.objects));
        }


        if (obj.owner != null) {
            objString += row("Owner", obj.owner.name);
        }
        if (obj.place != null) {
            objString += row("Place", obj.place.name);
        }

        return objString;
    }

    return {
        scope: true,
        link: function(scope, element, attrs) {
            var el;

            attrs.$observe('data', function(obj) {
                obj = JSON.parse(obj);

                tthtml = htmlOfObject(obj)
                html = "<a href='javascript:void(0)' class='ng-binding' tooltip-animation='false' tooltip-html-unsafe='" + tthtml + "'>" + obj.name + "</a>";
                el = $compile(html)(scope);

                element.html("");
                element.append(el);
            });
        }
    };
}).directive('scoreList', function($compile) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            var el;

            attrs.$observe('scores', function(scores) {
                if (!scores) {
                    return;
                }

                scores = JSON.parse(scores);
                var scores_list = [];
                for (var key in scores) {
                    scores_list.push({name: key, score: scores[key]});
                }
                scores_list.sort(function(a, b) {
                    var diff = b.score - a.score;
                    if (diff != 0) {
                        return diff;
                    }
                    return a.name.localeCompare(b.name);
                });

                var evt = '<ul class="score-list">';
                var maxScore = -1;
                scores_list.forEach(function(score) {
                    if (maxScore == -1 || score.score == maxScore) {
                        evt += "<li class='score-winner'><i class='fa fa-trophy fa-lg'></i> " + score.name + ": " + score.score + "</li>";
                        maxScore = score.score;
                    } else {
                        evt += "<li><i class='fa fa-user'></i> " + score.name + ": " + score.score + "</li>";
                    }
                });

                evt += '</ul>';
                el = $compile(evt)(scope);

                element.html("");
                element.append(el);
            });
        }
    }
}).directive('configList', function($compile) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            var el;

            attrs.$observe('config', function(config) {
                config = JSON.parse(config);

                var html = '<ul class="config-list">';
                html += "<li><b>Map Size</b>: " + config.map.size + "</li>";
                html += "<li><b>Map Wrapped</b>: " + config.map.wrap + "</li>";
                html += "<li><b>Max Turns</b>: " + config.max_steps + "</li>";

                if (config.items && config.items.length > 0) {
                    html += "<li>&nbsp;</li>";
                    config.items.forEach(function(item) {
                        html += "<li><b>" + item.type + "</b>: " + item.qty + "</li>";
                    });
                }

                if (config.periodic_events && config.periodic_events.length > 0) {
                    html += "<li>&nbsp;</li>";

                    config.periodic_events.forEach(function(periodic_event) {
                        html += "<li>" + periodic_event.description + " every " + periodic_event.interval  + " turns";
                    }); 
                }

                html += "</ul>";
  

                html = $compile(html)(scope);

                element.html("");
                element.append(html);
            });
        }
    }
});
