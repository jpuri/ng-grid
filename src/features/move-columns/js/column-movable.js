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

  module.directive('uiGridHeaderCell', ['$log', '$compile', '$q', 'gridUtil', function ($log, $compile, $q, gridUtil) {
    return {
      priority: -10,
      require: '^uiGrid',
      compile: function () {
        return {
          post: function ($scope, $elm, $attrs, uiGridCtrl) {
            if (uiGridCtrl.grid.options.enableColumnMoving) {
              var movingElm;
              $elm.on('mousedown', function (evt) {

                //Cloning header cell and appending to current header cell.
                movingElm = $elm.clone();
                $elm.append(movingElm);
                movingElm.css({'opacity': 0.25, position: 'fixed'});

                //Clone element should move horizontally with mouse.
                var offset;
                angular.element(gridUtil.closestElm(movingElm, '.ui-grid-header-canvas'))
                  .on('mousemove', function (evt) {
                  if (!offset) {
                    offset = evt.pageX - 1;
                  }
                  movingElm.css({'left': (evt.pageX - offset) + 'px'});

                  //Scroll the grid if end of canvas is reached.
                  /*
                   if(evt.offsetX > uiGridCtrl.grid.getViewportWidth()) {
                   uiGridCtrl.grid.GridRenderContainer.adjustScrollHorizontal(-50)
                   }
                   */
                });
              });
              //Remove the cloned element on mouse up.
              $elm.parent().parent().on('mouseup', function (evt) {
                if (movingElm) {
                  movingElm.remove();
                }
              });
            }
          }
        };
      }
    };
  }]);

})();