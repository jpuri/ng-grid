describe('ui.grid.moveColumns', function () {

  var scope, element, timeout;

  var data = [
    { "name": "Ethel Price", "gender": "female", "company": "Enersol" },
    { "name": "Claudine Neal", "gender": "female", "company": "Sealoud" },
    { "name": "Beryl Rice", "gender": "female", "company": "Velity" },
    { "name": "Wilder Gonzales", "gender": "male", "company": "Geekko" }
  ];

  beforeEach(module('ui.grid.moveColumns'));

  beforeEach(inject(function (_$compile_, $rootScope, $timeout) {

    var $compile = _$compile_;
    scope = $rootScope;
    timeout = $timeout;

    scope.gridOptions = {};
    scope.gridOptions.data = data;
    scope.gridOptions.columnDefs = [
      { field: 'name', width: 50 },
      { field: 'gender', width: 50},
      { field: 'company', enableColumnMoving:false}
    ];

    scope.gridOptions.onRegisterApi = function (gridApi) {
      scope.gridApi = gridApi;
      scope.grid = gridApi.grid;
    };

    element = angular.element('<div style="width: 500px; height: 300px" ui-grid="gridOptions" ui-grid-move-columns></div>');

    $timeout(function () {
      $compile(element)(scope);
    });
    $timeout.flush();
  }));

  it('grid api for columnMovable should be defined', function() {
    expect(scope.gridApi.colMovable).toBeDefined();
    expect(scope.gridApi.colMovable.on.columnPositionChanged).toBeDefined();
    expect(scope.gridApi.colMovable.raise.columnPositionChanged).toBeDefined();
    expect(scope.gridApi.colMovable.moveColumn).toBeDefined();
  });

  it('expect enableColumnMoving to be true by default', function() {
    expect(scope.grid.options.enableColumnMoving).toBe(true);
    expect(scope.grid.columns[0].colDef.enableColumnMoving).toBe(true);
    expect(scope.grid.columns[1].colDef.enableColumnMoving).toBe(true);
    expect(scope.grid.columns[2].colDef.enableColumnMoving).toBe(false);
  });

  it('expect moveColumn() to change position of columns', function() {
    scope.gridApi.colMovable.moveColumn(0, 1);
    expect(scope.grid.renderContainers.body.visibleColumnCache[0].name).toBe('gender');
    expect(scope.grid.renderContainers.body.visibleColumnCache[1].name).toBe('name');
    expect(scope.grid.renderContainers.body.visibleColumnCache[2].name).toBe('company');
  });

  it('expect moveColumn() to not change position of columns if enableColumnMoving is false', function() {
    scope.gridApi.colMovable.moveColumn(2, 1);
    expect(scope.grid.renderContainers.body.visibleColumnCache[0].name).toBe('name');
    expect(scope.grid.renderContainers.body.visibleColumnCache[1].name).toBe('gender');
    expect(scope.grid.renderContainers.body.visibleColumnCache[2].name).toBe('company');
  });

  it('expect event columnPositionChanged to be called when column position is changed', function() {
    var functionCalled = false;
    scope.gridApi.colMovable.on.columnPositionChanged(scope,function(column){
      functionCalled = true;
    });
    scope.gridApi.colMovable.moveColumn(0, 1);
    timeout(function(){
      expect(functionCalled).toBe(true);
    })
  });

  it('expect column to move right when dragged right', function() {
    var event = jQuery.Event("mousedown");
    var columnHeader = angular.element(element.find('.ui-grid-header-cell')[0]);
    columnHeader.trigger(event);
    event = jQuery.Event("mousemove", {
      pageX: 75
    });
    columnHeader.trigger(event);
    event = jQuery.Event("mouseup");
    columnHeader.trigger(event);
    timeout(function(){
      expect(scope.grid.renderContainers.body.visibleColumnCache[0].name).toBe('gender');
      expect(scope.grid.renderContainers.body.visibleColumnCache[1].name).toBe('name');
      expect(scope.grid.renderContainers.body.visibleColumnCache[2].name).toBe('company');
    })
  });

  it('expect column to move left when dragged left', function() {
    var event = jQuery.Event("mousedown");
    var columnHeader = angular.element(element.find('.ui-grid-header-cell')[1]);
    columnHeader.trigger(event);
    event = jQuery.Event("mousemove", {
      pageX: -75
    });
    columnHeader.trigger(event);
    event = jQuery.Event("mouseup");
    columnHeader.trigger(event);
    timeout(function(){
      expect(scope.grid.renderContainers.body.visibleColumnCache[0].name).toBe('gender');
      expect(scope.grid.renderContainers.body.visibleColumnCache[1].name).toBe('name');
      expect(scope.grid.renderContainers.body.visibleColumnCache[2].name).toBe('company');
    })
  });

  it('expect column movement to not happen if enableColumnMoving is false', function() {
    var event = jQuery.Event("mousedown");
    var columnHeader = angular.element(element.find('.ui-grid-header-cell')[3]);
    columnHeader.trigger(event);
    event = jQuery.Event("mousemove", {
      pageX: 75
    });
    columnHeader.trigger(event);
    event = jQuery.Event("mouseup");
    columnHeader.trigger(event);
    timeout(function(){
      expect(scope.grid.renderContainers.body.visibleColumnCache[0].name).toBe('name');
      expect(scope.grid.renderContainers.body.visibleColumnCache[1].name).toBe('gender');
      expect(scope.grid.renderContainers.body.visibleColumnCache[2].name).toBe('company');
    })
  });
});