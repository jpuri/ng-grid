(function () {
  'use strict';

  var module = angular.module('ui.grid.moveColumns', ['ui.grid']);

  module.service('uiGridMoveColumnService', ['$q', '$timeout', function ($q, $timeout) {

    var service = {
      initializeGrid: function (grid) {
        var self = this;
        this.registerPublicApi(grid);
        this.defaultGridOptions(grid.options);
        grid.registerColumnBuilder(self.movableColumnBuilder);
      },
      registerPublicApi: function (grid) {
        var self = this;
        var publicApi = {
          events: {
            colMovable: {
              columnPositionChanged: function (scope, col) {
              }
            },
            methods: {
              colMovable: {
                //The parameters should be column or positions ?
                moveColumn: function (originalPosition, finalPosition) {
                  self.redrawColumnAtPosition(grid, originalPosition, finalPosition);
                }
              }
            }
          }
        };
        grid.api.registerEventsFromObject(publicApi.events);
        grid.api.registerMethodsFromObject(publicApi.methods);
      },
      defaultGridOptions: function (gridOptions) {
        gridOptions.enableColumnMoving = gridOptions.enableColumnMoving !== false;
      },
      movableColumnBuilder: function (colDef, col, gridOptions) {
        var promises = [];
        colDef.enableColumnMoving = colDef.enableColumnMoving === undefined ? gridOptions.enableColumnMoving
          : colDef.enableColumnMoving;
        return $q.all(promises);
      },
      redrawColumnAtPosition: function (grid, originalPosition, newPosition) {
        var visibleColumns = grid.renderContainers['body'].visibleColumnCache;
        var originalColumn = visibleColumns[originalPosition];
        if (originalPosition > newPosition) {
          for (var i1 = originalPosition; i1 > newPosition; i1--) {
            visibleColumns[i1] = visibleColumns[i1 - 1];
          }
        }
        else if (newPosition > originalPosition) {
          for (var i2 = originalPosition; i2 < newPosition; i2++) {
            visibleColumns[i2] = visibleColumns[i2 + 1];
          }
        }
        visibleColumns[newPosition] = originalColumn;
        $timeout(function () {
          grid.redrawInPlace();
          grid.refreshCanvas(true);
          grid.api.colMovable.raise.columnPositionChanged(originalColumn);
        });
      }

  };
    return service;
  }]);

  module.directive('uiGridMoveColumns', ['uiGridMoveColumnService', function (uiGridMoveColumnService) {
    return {
      replace: true,
      priority: 0,
      require: '^uiGrid',
      scope: false,
      compile: function () {
        return {
          pre: function ($scope, $elm, $attrs, uiGridCtrl) {
            uiGridMoveColumnService.initializeGrid(uiGridCtrl.grid);
          },
          post: function ($scope, $elm, $attrs, uiGridCtrl) {
          }
        };
      }
    };
  }]);

  module.directive('uiGridHeaderCell', ['$q', 'gridUtil', 'uiGridMoveColumnService', function ($q, gridUtil, uiGridMoveColumnService) {
    return {
      priority: -10,
      require: '^uiGrid',
      compile: function () {
        return {
          post: function ($scope, $elm, $attrs, uiGridCtrl) {
            if ($scope.col.colDef.enableColumnMoving) {

              var mouseDownHandler = function (evt) {

                //Cloning header cell and appending to current header cell.
                var movingElm = $elm.clone();
                $elm.append(movingElm);

                //Left of cloned element should be aligned to original header cell.
                var gridLeft = $scope.grid.element[0].getBoundingClientRect().left;
                var elmLeft = $elm[0].getBoundingClientRect().left;
                var movingElmLeftOffset = elmLeft - gridLeft;
                movingElm.css({'opacity': 1, position: 'fixed', left: movingElmLeftOffset + 'px'});

                //Setting some variables required fro calculations.
                var previousMouseX = evt.pageX;
                var originalMouseX = evt.pageX;
                var totalMouseMovement = 0;
                var originalScrollLeft = $scope.grid.renderContainers['body'].prevScrollLeft;
                var totalScroll = $scope.grid.renderContainers['body'].prevScrollLeft;
                var rightMoveLimit = gridLeft + $scope.grid.getViewportWidth() - $scope.grid.verticalScrollbarWidth;

                //Clone element should move horizontally with mouse.
                var mouseMoveHandler = function (evt) {
                  var currentElmLeft = movingElm[0].getBoundingClientRect().left;
                  var currentElmRight = movingElm[0].getBoundingClientRect().right;
                  var changeValue = evt.pageX - previousMouseX;
                  var newElementLeft = currentElmLeft - gridLeft + changeValue;
                  newElementLeft = newElementLeft < rightMoveLimit ? newElementLeft : rightMoveLimit;
                  if ((currentElmLeft >= gridLeft || changeValue > 0) && (currentElmRight <= rightMoveLimit || changeValue < 0)) {
                    movingElm.css({'left': newElementLeft + 'px'});
                  }
                  else {
                    totalScroll += changeValue;
                    uiGridCtrl.fireScrollingEvent({ x: { pixels: changeValue * 5 } });
                  }
                  totalMouseMovement += changeValue;
                  previousMouseX = evt.pageX;
                };
                angular.element(gridUtil.closestElm($elm, 'body'))
                  .on('mousemove', mouseMoveHandler);


                var mouseUpHandler = function (evt) {
                  var renderIndexDefer = $q.defer();

                  var renderIndex;
                  $attrs.$observe('renderIndex', function (n, o) {
                    renderIndex = $scope.$eval(n);

                    renderIndexDefer.resolve();
                  });

                  renderIndexDefer.promise.then(function () {
                    //Remove the cloned element on mouse up.
                    if (movingElm) {
                      movingElm.remove();
                    }

                    var visibleColumns = $scope.grid.renderContainers['body'].visibleColumnCache;
                    //Case where column should be moved to a position on its left
                    if (totalMouseMovement < 0) {
                      //Case where column should be moved to beginning of the grid.
                      if ((totalMouseMovement + movingElmLeftOffset + originalScrollLeft) <= 0) {
                        uiGridMoveColumnService.redrawColumnAtPosition($scope.grid, renderIndex, 0);
                      }
                      else {
                        var totalColumnsLeftWidth = 0;
                        for (var il = renderIndex - 1; il >= 0; il--) {
                          totalColumnsLeftWidth += visibleColumns[il].drawnWidth;
                          if (totalColumnsLeftWidth > Math.abs(totalMouseMovement)) {
                            uiGridMoveColumnService.redrawColumnAtPosition($scope.grid, renderIndex, il + 1);
                            break;
                          }
                        }
                      }
                    }
                    //Case where column should be moved to a position on its right
                    else if (totalMouseMovement > movingElmLeftOffset) {
                      //Case where column should be moved to end of the grid.
                      if (totalMouseMovement + movingElmLeftOffset + $elm[0].drawnWidth >= $scope.grid.getViewportWidth()) {
                        uiGridMoveColumnService.redrawColumnAtPosition($scope.grid, renderIndex, visibleColumns.length - 1);
                      }
                      else {
                        var totalColumnsRightWidth = originalScrollLeft;
                        for (var ir = renderIndex + 1; ir < visibleColumns.length; ir++) {
                          totalColumnsRightWidth += visibleColumns[ir].drawnWidth;
                          if (totalColumnsRightWidth > totalMouseMovement) {
                            uiGridMoveColumnService.redrawColumnAtPosition($scope.grid, renderIndex, ir - 1);
                            break;
                          }
                        }
                      }
                    }

                    angular.element(gridUtil.closestElm($elm, 'body'))
                      .off('mousemove', mouseMoveHandler);
                    angular.element(gridUtil.closestElm($elm, 'body'))
                      .off('mouseup', mouseUpHandler);
                  });
                };
                angular.element(gridUtil.closestElm($elm, 'body'))
                  .on('mouseup', mouseUpHandler);
              };
              $elm.on('mousedown', mouseDownHandler);
            }
          }
        };
      }
    };
  }]);
})();

//TODO: functionality to be tested with row headers, column visibility.
//When moving right most column ...it appears on blank space