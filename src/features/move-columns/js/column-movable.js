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
          post: function ($scope, $elm, $attrs, uiGridCtrl, uiGridRenderContainer) {
            if (uiGridCtrl.grid.options.enableColumnMoving) {
              var movingElm;
              $elm.on('mousedown', function (evt) {

                //Cloning header cell and appending to current header cell.
                movingElm = $elm.clone();
                $elm.append(movingElm);

                //Left of cloned element should be aligned to original header cell.
                var gridLeft = uiGridCtrl.grid.element[0].getBoundingClientRect().left;
                var elmLeft = $elm[0].getBoundingClientRect().left;
                var movingElmLeft = elmLeft - gridLeft;
                movingElm.css({'opacity': 0.75, position: 'fixed', left: movingElmLeft + 'px'});

                //Clone element should move horizontally with mouse.
                var gridRight = gridLeft + uiGridCtrl.grid.getViewportWidth();
                var headerCellWidth = $elm[0].getBoundingClientRect().right -
                  $elm[0].getBoundingClientRect().left;

                angular.element(gridUtil.closestElm($elm, '.ui-grid-header-canvas'))
                  .on('mousemove', function (evt) {
                    var changeValue = evt.pageX - elmLeft;
                    if ((evt.pageX >= gridLeft) && (evt.pageX <= (gridRight - headerCellWidth))) {
                      movingElm.css({'left': (movingElmLeft + changeValue) + 'px'});
                    }
                    //add condition to check is horizontal scroll exists
                    if (evt.pageX < (gridLeft + 5)) {
                      uiGridCtrl.fireScrollingEvent({ x: { pixels: -1 } });
                    }
                    if (evt.pageX > (gridRight - uiGridCtrl.grid.verticalScrollbarWidth)) {
                      uiGridCtrl.fireScrollingEvent({ x: { pixels: 1 } });
                    }
                    console.log('&&&&', uiGridCtrl.grid.renderContainers['body'].prevScrollLeft);
                  });
              });
              //Remove the cloned element on mouse up.
              angular.element(gridUtil.closestElm($elm, 'body'))
                .on('mouseup', function (evt) {
                  if (movingElm) {
                    movingElm.remove();
                  }
                  angular.element(gridUtil.closestElm($elm, '.ui-grid-header-canvas'))
                    .off('mousemove');
                });
            }
          }
        };
      }
    };
  }]);

})();