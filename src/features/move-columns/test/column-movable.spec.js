describe('ui.grid.moveColumns', function () {
  var grid, $scope, $compile, recompile, uiGridConstants;

  var data = [
    { "name": "Ethel Price", "gender": "female", "company": "Enersol" },
    { "name": "Claudine Neal", "gender": "female", "company": "Sealoud" },
    { "name": "Beryl Rice", "gender": "female", "company": "Velity" },
    { "name": "Wilder Gonzales", "gender": "male", "company": "Geekko" }
  ];

  beforeEach(module('ui.grid'));
  beforeEach(module('ui.grid.moveColumns'));

  beforeEach(inject(function (_$compile_, $rootScope, _uiGridConstants_) {
    $scope = $rootScope;
    $compile = _$compile_;
    uiGridConstants = _uiGridConstants_;

    $scope.gridOpts = {
      enableColumnResizing: true,
      data: data
    };

    recompile = function () {
      grid = angular.element('<div style="width: 500px; height: 300px" ui-grid="gridOpts"></div>');
      document.body.appendChild(grid[0]);
      $compile(grid)($scope);
      $scope.$digest();
    };

    recompile();
  }));

  afterEach(function () {
    angular.element(grid).remove();
    grid = null;
  });

  describe('setting enableColumnMoving', function () {

    it('temp', function () {

      expect(true).toEqual(true);
    });

  });

});