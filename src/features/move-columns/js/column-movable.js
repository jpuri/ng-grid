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

  module.directive('uiGridHeaderCell', ['$log', '$compile', '$q', 'gridUtil', '$timeout', function ($log, $compile, $q, gridUtil, $timeout) {
    return {
      priority: -10,
      require: '^uiGrid',
      compile: function () {
        return {
          post: function ($scope, $elm, $attrs, uiGridCtrl) {
            if (uiGridCtrl.grid.options.enableColumnMoving) {
              var renderIndexDefer = $q.defer();

              $attrs.$observe('renderIndex', function (n, o) {
                $scope.renderIndex = $scope.$eval(n);

                renderIndexDefer.resolve();
              });

              renderIndexDefer.promise.then(function () {
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

                    //Clone element should move horizontally with mouse.
                    var previousMouseX = evt.pageX;
                    var originalMouseX = evt.pageX;
                    var totalMouseMovement = 0;
                    var originalScrollLeft = uiGridCtrl.grid.renderContainers['body'].prevScrollLeft;
                    var totalScroll = uiGridCtrl.grid.renderContainers['body'].prevScrollLeft;
                    var mouseMoveHandler = function (evt) {
                      var currentElmLeft = movingElm[0].getBoundingClientRect().left;
                      var currentElmRight = movingElm[0].getBoundingClientRect().right;
                      var changeValue = evt.pageX - previousMouseX;
                      var newElementLeft = currentElmLeft - gridLeft + changeValue;
                      newElementLeft = newElementLeft < rightMoveLimit ? newElementLeft : rightMoveLimit;
                      if (changeValue < 0) {
                        newElementLeft -= 2;
                      }
                      if ((currentElmLeft >= gridLeft || changeValue > 0) && (currentElmRight <= rightMoveLimit || changeValue < 0)) {
                        movingElm.css({'left': newElementLeft + 'px'});
                      }
                      else {
                        totalScroll += changeValue;
                        uiGridCtrl.fireScrollingEvent({ x: { pixels: changeValue * 5 } });
                      }
                      previousMouseX = evt.pageX;
                    };
                    angular.element(gridUtil.closestElm($elm, 'body'))
                      .on('mousemove', mouseMoveHandler);

                    var visibleColumns = uiGridCtrl.grid.renderContainers['body'].visibleColumnCache;

                    var redrawColumnAtLeftPosition = function (position) {
                      for (var i1 = $scope.renderIndex; i1 > position; i1--) {
                        visibleColumns[i1] = visibleColumns[i1 - 1];
                      }
                      visibleColumns[position] = $scope.col;
                      redrawGrid();
                    };

                    var redrawColumnAtRightPosition = function (position) {
                      for (var i2 = $scope.renderIndex; i2 < position; i2++) {
                        visibleColumns[i2] = visibleColumns[i2 + 1];
                      }
                      visibleColumns[position] = $scope.col;
                      redrawGrid();
                    };

                    var redrawGrid = function () {
                      uiGridCtrl.grid.api.colMovable.raise.columnPositionChanged($scope.col);
                      $timeout(function () {
                        uiGridCtrl.grid.redrawInPlace();
                        uiGridCtrl.grid.refreshCanvas(true);
                      });
                    };

                    var mouseUpHandler = function (evt) {
                      var renderIndexDefer = $q.defer();

                      $attrs.$observe('renderIndex', function (n, o) {
                        $scope.renderIndex = $scope.$eval(n);

                        renderIndexDefer.resolve();
                      });

                      renderIndexDefer.promise.then(function () {
                        //Remove the cloned element on mouse up.
                        if (movingElm) {
                          movingElm.remove();
                        }
                        var totalMouseMovement = previousMouseX - originalMouseX + uiGridCtrl.grid.renderContainers['body'].prevScrollLeft;
                        console.log('totalMouseMovement', uiGridCtrl.grid.renderContainers['body'].prevScrollLeft);
                        console.log('getViewportWidth', uiGridCtrl.grid.renderContainers['body'].getCanvasWidth());
                        //Case where column should be moved to a position on its left
                        if (totalMouseMovement < 0) {
                          //Case where column should be moved to beginning of the grid.
                          if ((totalMouseMovement + movingElmLeftOffset + originalScrollLeft) <= 0) {
                            redrawColumnAtLeftPosition(0);
                          }
                          else {
                            var totalColumnsLeftWidth = totalScroll;
                            for (var il = $scope.renderIndex - 1; il >= 0; il--) {
                              totalColumnsLeftWidth += visibleColumns[il].drawnWidth;
                              if (totalColumnsLeftWidth > Math.abs(totalMouseMovement)) {
                                redrawColumnAtLeftPosition(il + 1);
                                break;
                              }
                            }
                          }
                        }
                        //Case where column should be moved to a position on its right
                        else if (totalMouseMovement > movingElmLeftOffset) {
                          if (totalMouseMovement + movingElmLeftOffset + movingCellWidth >= uiGridCtrl.grid.getViewportWidth()) {
                            redrawColumnAtRightPosition(visibleColumns.length-1);
                          }
                          else {
                            var totalColumnsRightWidth = totalScroll;
                            for (var ir = $scope.renderIndex + 1; ir < visibleColumns.length; ir++) {
                              totalColumnsRightWidth += visibleColumns[ir].drawnWidth;
                              if (totalColumnsRightWidth > totalMouseMovement) {
                                redrawColumnAtRightPosition(ir - 1);
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
                  }
                );
              });
            }
          }
        };
      }
    };
  }]);
})();

//TODO: functionality to be tested with row headers, column visibility.
//When moving right most column ...it appears on blank space