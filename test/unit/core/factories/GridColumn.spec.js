describe('GridColumn factory', function () {
  var $q, $scope, cols, grid, gridCol, Grid, GridColumn, gridClassFactory, GridRenderContainer, uiGridConstants;

  beforeEach(module('ui.grid'));

  function buildCols() {
    grid.buildColumns();
  }


  beforeEach(inject(function (_$q_, _$rootScope_, _Grid_, _GridColumn_, _gridClassFactory_, _GridRenderContainer_, _uiGridConstants_) {
    $q = _$q_;
    $scope = _$rootScope_;
    Grid = _Grid_;
    GridColumn = _GridColumn_;
    gridClassFactory = _gridClassFactory_;
    GridRenderContainer = _GridRenderContainer_;
    uiGridConstants = _uiGridConstants_;

    cols = [
      { field: 'firstName' }
    ];

    grid = new Grid({ id: 1 });

    grid.registerColumnBuilder(gridClassFactory.defaultColumnBuilder);

    grid.options.columnDefs = cols;

    buildCols();
  }));
  
  describe('buildColumns', function () {
    it('should not remove existing sort details on a column', function () {
      var sort = { priority: 0, direction: 'asc' };
      grid.columns[0].sort = sort;

      runs(buildCols);

      runs(function () {
        expect(grid.columns[0].sort).toEqual(sort);
      });
    });

    it('should obey columnDef sort spec', function () {
      // ... TODO(c0bra)
    });
  });

  describe('getRenderContainer', function () {
    it('should return the body container by default if the column has no render container specified', function () {
      var col = grid.columns[0];

      var container = col.getRenderContainer();

      expect(container.name).toEqual('body');
    });

    it('should return the container the column belongs to when the column has a specific render container specified', function () {
      // Add a new render container
      grid.renderContainers.blah = new GridRenderContainer('blah', grid);

      var col = grid.columns[0];
      col.renderContainer = 'blah';

      buildCols();

      var container = col.getRenderContainer();

      expect(container.name).toEqual('blah');
    });
  });

  describe('showColumn', function () {
    it('should set colDef.visible', function () {
      var col = grid.columns[0];
      col.showColumn();
      expect(col.colDef.visible).toBe(true);
      col.hideColumn();
      expect(col.colDef.visible).toBe(false);
    });
  });
  
  describe('aggregation', function() {
    beforeEach( function() {
      grid.options.data = [
        { name: 'fred', value: 1 },
        { name: 'john', value: 2 },
        { name: 'james', value: 3 },
        { name: 'matthew', value: 4 },
        { name: 'murray', value: 5 },
      ];
      grid.options.columnDefs = [ {name: 'name'}, {name: 'value'}];  
    });
    
    it('count, with label', function() {
      grid.options.columnDefs[0].aggregationType = uiGridConstants.aggregationTypes.count;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[0].getAggregationValue()).toEqual('total rows: 5');
    });

    it('count, without label', function() {
      grid.options.columnDefs[0].aggregationType = uiGridConstants.aggregationTypes.count;
      grid.options.columnDefs[0].aggregationHideLabel = true;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[0].getAggregationValue()).toEqual(5);
    });

    it('sum, with label', function() {
      grid.options.columnDefs[1].aggregationType = uiGridConstants.aggregationTypes.sum;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[1].getAggregationValue()).toEqual('total: 15');
    });

    it('sum, without label', function() {
      grid.options.columnDefs[1].aggregationType = uiGridConstants.aggregationTypes.sum;
      grid.options.columnDefs[1].aggregationHideLabel = true;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[1].getAggregationValue()).toEqual(15);
    });

    it('avg, with label', function() {
      grid.options.columnDefs[1].aggregationType = uiGridConstants.aggregationTypes.avg;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[1].getAggregationValue()).toEqual('avg: 3');
    });

    it('avg, without label', function() {
      grid.options.columnDefs[1].aggregationType = uiGridConstants.aggregationTypes.avg;
      grid.options.columnDefs[1].aggregationHideLabel = true;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[1].getAggregationValue()).toEqual(3);
    });    

    it('min, with label', function() {
      grid.options.columnDefs[1].aggregationType = uiGridConstants.aggregationTypes.min;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[1].getAggregationValue()).toEqual('min: 1');
    });

    it('min, without label', function() {
      grid.options.columnDefs[1].aggregationType = uiGridConstants.aggregationTypes.min;
      grid.options.columnDefs[1].aggregationHideLabel = true;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[1].getAggregationValue()).toEqual(1);
    });

    it('max, with label', function() {
      grid.options.columnDefs[1].aggregationType = uiGridConstants.aggregationTypes.max;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[1].getAggregationValue()).toEqual('max: 5');
    });

    it('max, without label', function() {
      grid.options.columnDefs[1].aggregationType = uiGridConstants.aggregationTypes.max;
      grid.options.columnDefs[1].aggregationHideLabel = true;
      
      buildCols();
      grid.modifyRows(grid.options.data);
      grid.setVisibleRows(grid.rows);
      
      expect(grid.columns[1].getAggregationValue()).toEqual(5);
    });
  });

});