(function () {
  'use strict';

  var module = angular.module('ui.grid.moveColumns', ['ui.grid']);

  module.service('uiGridMoveColumnService', ['$log', '$q',
    function ($log, $q) {

      var service = {
        initializeGrid: function (grid) {
          this.registerPublicApi(grid);
          this.defaultGridOptions(grid.options);
        },
        registerPublicApi: function (grid) {
          var publicApi = {
            events: {
              colMovable: {
                columnPositionChanged: function (scope, col) {
                }
              }
            }
          };
          grid.api.registerEventsFromObject(publicApi.events);
        },
        defaultGridOptions: function (gridOptions) {
          gridOptions.enableColumnMoving = gridOptions.enableColumnMoving !== false;
        },
        movableColumnBuilder: function (colDef, col, gridOptions) {
          var promises = [];
          colDef.enableColumnMoving = colDef.enableColumnMoving === undefined ? gridOptions.enableColumnMoving
            : colDef.enableColumnMoving;
          return $q.all(promises);
        }
      };
      return service;
    }]);

  module.directive('uiGridMoveColumns', ['$log', 'uiGridMoveColumnService', function ($log, uiGridMoveColumnService) {
    return {
      replace: true,
      priority: 0,
      require: '^uiGrid',
      scope: false,
      compile: function () {
        return {
          pre: function ($scope, $elm, $attrs, uiGridCtrl) {
            uiGridMoveColumnService.initializeGrid(uiGridCtrl.grid);
            uiGridCtrl.grid.registerColumnBuilder(uiGridMoveColumnService.movableColumnBuilder);
          },
          post: function ($scope, $elm, $attrs, uiGridCtrl) {
          }
        };
      }
    };
  }]);

  module.directive('uiGridHeaderCell', ['$log', '$compile', '$q', function ($log, $compile, $q) {
    return {
      priority: -10,
      require: '^uiGrid',
      compile: function () {
        return {
          post: function ($scope, $elm, $attrs, uiGridCtrl) {
            if (uiGridCtrl.grid.options.enableColumnMoving) {
              var movingHeaderCell;
              $elm.on('mousedown', function (evt) {
                movingHeaderCell = $elm.clone();
                $elm.append(movingHeaderCell);
                movingHeaderCell.css({'opacity': 0.25, 'backgroundColor': 'red'});
                angular.element('.ui-grid-header-canvas').on('mousemove', function (evt) {
                  movingHeaderCell.css({'left': evt.offsetX});
/*
                  if(evt.offsetX > uiGridCtrl.grid.getViewportWidth()) {
                    uiGridCtrl.grid.GridRenderContainer.adjustScrollHorizontal(-50)
                  }
*/
                });
              });
              $elm.on('mouseup', function (evt) {
                //movingHeaderCell.remove();
              });
            }
          }
        };
      }
    };
  }]);

})();