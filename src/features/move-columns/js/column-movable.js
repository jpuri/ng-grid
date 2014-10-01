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
                    var totalMouseMovement = 0;
                    var originalScrollLeft = uiGridCtrl.grid.renderContainers['body'].prevScrollLeft;
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
                        uiGridCtrl.fireScrollingEvent({ x: { pixels: changeValue * 5 } });
                      }
                      previousMouseX = evt.pageX;
                      totalMouseMovement += changeValue;
                    };
                    angular.element(gridUtil.closestElm($elm, 'body'))
                      .on('mousemove', mouseMoveHandler);

                    //index in calculations below to be replaced with render index and visible column cache
                    console.log('************', $scope.renderIndex);
                    var redrawColumnAtLeftPosition = function (position) {
                      for (var i1 = $scope.renderIndex; i1 > position; i1--) {
                        uiGridCtrl.grid.columns[i1] = uiGridCtrl.grid.columns[i1 - 1];
                        uiGridCtrl.grid.columns[i1].index = i1;
                        uiGridCtrl.grid.columns[i1].colDef.index = i1;
                      }
                      uiGridCtrl.grid.columns[position] = $scope.col;
                      uiGridCtrl.grid.columns[position].index = position;
                      uiGridCtrl.grid.columns[position].colDef.index = position;
                      uiGridCtrl.grid.api.colMovable.raise.columnPositionChanged($scope.col);
                    };

                    var redrawColumnAtRightPosition = function (position) {
                      var index = $scope.col.index;
                      for (var i2 = index; i2 < position - 1; i2++) {
                        uiGridCtrl.grid.columns[i2] = uiGridCtrl.grid.columns[i2 + 1];
                        uiGridCtrl.grid.columns[i2].index = i2;
                        uiGridCtrl.grid.columns[i2].colDef.index = i2;
                      }
                      uiGridCtrl.grid.columns[position - 1] = $scope.col;
                      uiGridCtrl.grid.columns[position - 1].index = position - 1;
                      uiGridCtrl.grid.columns[position - 1].colDef.index = position - 1;
                      uiGridCtrl.grid.api.colMovable.raise.columnPositionChanged($scope.col);
                    };

                    //Remove the cloned element on mouse up.
                    var mouseUpHandler = function (evt) {
                      if (movingElm) {
                        movingElm.remove();
                      }
                      //Case where column should be moved to a position on its left
                      //Calculations for now assume fixed width columns
                      console.log('totalMouseMovement', totalMouseMovement);
                      if (totalMouseMovement < 0) {
                        //Case where column should be moved to beginning of the grid.
                        if ((totalMouseMovement + movingElmLeftOffset + originalScrollLeft) <= 0) {
                          redrawColumnAtLeftPosition(0);
                        }
                        else {
                          var totalColumnsLeftWidth = 0;
                          for (var il = $scope.col.index - 1; il >= 0; il--) {
                            var column = uiGridCtrl.grid.columns[il];
                            if (column.colDef.visible === undefined || column.colDef.visible === true) {
                              totalColumnsLeftWidth += column.drawnWidth;
                              if (totalColumnsLeftWidth < Math.abs(totalMouseMovement)) {
                                continue;
                              }
                              redrawColumnAtLeftPosition(il + 1);
                              break;
                            }
                          }
                        }
                      }
                      //Case where column should be moved to a position on its right
                      //Case where column should be moved to end of the grid.
                      else if (totalMouseMovement > movingElmLeftOffset) {
                        if (totalMouseMovement + movingElmLeftOffset + movingCellWidth >= uiGridCtrl.grid.getViewportWidth()) {
                          redrawColumnAtRightPosition(uiGridCtrl.grid.columns.length);
                        }
                        else {
                          var totalColumnsRightWidth = 0;
                          for (var ir = $scope.col.index + 1; ir < uiGridCtrl.grid.columns.length; ir++) {
                            var movedColumn = uiGridCtrl.grid.columns[ir];
                            if (movedColumn.colDef.visible === undefined || movedColumn.colDef.visible === true) {
                              totalColumnsRightWidth += movedColumn.drawnWidth;
                              if (totalColumnsRightWidth < totalMouseMovement) {
                                continue;
                              }
                              redrawColumnAtRightPosition(ir);
                              break;
                            }
                          }
                        }
                      }
                      //render container - adjustColumns
                      //self.refreshCanvas(true);
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
              );
            }
          }
        };
      }
    };
  }]);

})();

//TODO: functionality to be tested with row headers, column visibility.
//When moving right most column ...it appears on blank space