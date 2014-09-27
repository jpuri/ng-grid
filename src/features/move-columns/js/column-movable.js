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
                var rightLimit = gridLeft + uiGridCtrl.grid.getViewportWidth() - uiGridCtrl.grid.verticalScrollbarWidth;
                var rightScrollLimit = uiGridCtrl.grid.gridWidth;

                //Clone element should move horizontally with mouse.
                var mouseMovement = evt.pageX - gridLeft;
                var previousMouseX = evt.pageX;
                angular.element(gridUtil.closestElm($elm, 'body'))
                  .on('mousemove', function (evt) {
                    var currentElmLeft = movingElm[0].getBoundingClientRect().left;
                    var currentElmRight = movingElm[0].getBoundingClientRect().right;
                    ///var elmLeftOffset = parseInt(movingElm.css('left').substring(0, movingElm.css('left').length - 2));
                    var changeValue = evt.pageX - previousMouseX;
                    var newElementLeft = currentElmLeft - gridLeft + changeValue;
                    newElementLeft = newElementLeft < rightLimit ? newElementLeft: rightLimit;
                    if ((currentElmLeft >= gridLeft || changeValue > 0) && (currentElmRight <= rightLimit || changeValue < 0)) {
                      movingElm.css({'left': newElementLeft + 'px'});
                    }
                    else {
                      uiGridCtrl.fireScrollingEvent({ x: { pixels: changeValue * 5 } });
                    }
                    previousMouseX = evt.pageX;
                    // a check can be added to see if horizontal scroll exists.
                    //console.log('&&&&', uiGridCtrl.grid.renderContainers['body'].prevScrollLeft);
                  });
                //Remove the cloned element on mouse up.
                angular.element(gridUtil.closestElm($elm, 'body'))
                  .on('mouseup', function (evt) {
                    if (movingElm) {
                      movingElm.remove();
                    }
                    angular.element(gridUtil.closestElm($elm, 'body'))
                      .off('mousemove');
                    angular.element(gridUtil.closestElm($elm, 'body'))
                      .off('mouseup');
                  });
              });
            }
          }
        };
      }
    };
  }]);

})();