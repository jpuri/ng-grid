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

                //Left of cloned element should be aligned to original header cell.
                var gridLeft = uiGridCtrl.grid.element[0].getBoundingClientRect().left;
                var elmLeft = $elm[0].getBoundingClientRect().left;
                var movingElmLeftOffset = elmLeft - gridLeft;
                movingElm.css({'opacity': 1, position: 'fixed', left: movingElmLeftOffset + 'px'});
                var movingCellWidth = $elm[0].getBoundingClientRect().right -
                  $elm[0].getBoundingClientRect().left;
                var rightMoveLimit = gridLeft + uiGridCtrl.grid.getViewportWidth() - uiGridCtrl.grid.verticalScrollbarWidth;
                var rightScrollLimit = uiGridCtrl.grid.gridWidth;

                //Clone element should move horizontally with mouse.
                var previousMouseX = evt.pageX;
                var totalMouseMovement = 0;
                var originalScrollLeft = uiGridCtrl.grid.renderContainers['body'].prevScrollLeft;
                var mouseMoveHandler = function (evt) {
                  var currentElmLeft = movingElm[0].getBoundingClientRect().left;
                  var currentElmRight = movingElm[0].getBoundingClientRect().right;
                  var changeValue = evt.pageX - previousMouseX;
                  var newElementLeft = currentElmLeft - gridLeft + changeValue;
                  newElementLeft = newElementLeft < rightMoveLimit ? newElementLeft: rightMoveLimit;
                  if ((currentElmLeft >= gridLeft || changeValue > 0) && (currentElmRight <= rightMoveLimit || changeValue < 0)) {
                    movingElm.css({'left': newElementLeft + 'px'});
                  }
                  else {
                    uiGridCtrl.fireScrollingEvent({ x: { pixels: changeValue * 5 } });
                  }
                  previousMouseX = evt.pageX;
                  totalMouseMovement += changeValue;
                };
                angular.element(gridUtil.closestElm($elm, 'body'))
                  .on('mousemove', mouseMoveHandler);

                //Remove the cloned element on mouse up.
                var mouseUpHandler = function (evt) {
                  if (movingElm) {
                    movingElm.remove();
                  }
                  //Case where column should be moved to beginning of the grid.
                  if ((totalMouseMovement + movingElmLeftOffset  + originalScrollLeft)<= 0) {
                    for (var i1 = $scope.col.index; i1 > 0; i1--) {
                      uiGridCtrl.grid.columns[i1] = uiGridCtrl.grid.columns[i1-1];
                      uiGridCtrl.grid.columns[i1].index = i1;
                      uiGridCtrl.grid.columns[i1].colDef.index = i1;
                    }
                    uiGridCtrl.grid.columns[0] = $scope.col;
                    uiGridCtrl.grid.columns[0].index = 0;
                    uiGridCtrl.grid.columns[0].colDef.index = 0;
                  }
                  //Case where column should be moved to end of the grid.
                  else if (totalMouseMovement + movingElmLeftOffset + movingCellWidth >= uiGridCtrl.grid.getViewportWidth()) {
                    var totalColumns = uiGridCtrl.grid.columns.length;
                    var index = $scope.col.index;
                    for (var i2 = index; i2 < totalColumns-1; i2++) {
                      uiGridCtrl.grid.columns[i2] = uiGridCtrl.grid.columns[i2+1];
                      uiGridCtrl.grid.columns[i2].index = i2;
                      uiGridCtrl.grid.columns[i2].colDef.index = i2;
                    }
                    uiGridCtrl.grid.columns[totalColumns-1] = $scope.col;
                    uiGridCtrl.grid.columns[totalColumns-1].index = totalColumns-1;
                    uiGridCtrl.grid.columns[totalColumns-1].colDef.index = totalColumns-1;
                  }
                  //Case where column should be moved to a position on its left
                  else if (false) {
                  }
                  //Case where column should be moved to a position on its right
                  else if (false) {
                  }

                  uiGridCtrl.grid.refresh();
                  angular.element(gridUtil.closestElm($elm, 'body'))
                    .off('mousemove', mouseMoveHandler);
                  angular.element(gridUtil.closestElm($elm, 'body'))
                    .off('mouseup', mouseUpHandler);
                };
                angular.element(gridUtil.closestElm($elm, 'body'))
                  .on('mouseup', mouseUpHandler);

              });
            }
          }
        };
      }
    };
  }]);

})();

//TODO: functionality to be tested with row headers.