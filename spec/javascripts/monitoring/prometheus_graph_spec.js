import 'jquery';
import es6Promise from 'es6-promise';
import '~/lib/utils/common_utils';
import PrometheusGraph from '~/monitoring/prometheus_graph';
import { prometheusMockData } from './prometheus_mock_data';

es6Promise.polyfill();

describe('PrometheusGraph', () => {
  const fixtureName = 'static/environments/metrics.html.raw';
  const prometheusGraphContainer = '.prometheus-graph';
  const prometheusGraphContents = `${prometheusGraphContainer}[graph-type=cpu_values]`;

  preloadFixtures(fixtureName);

  beforeEach(() => {
    loadFixtures(fixtureName);
    this.prometheusGraph = new PrometheusGraph();
    const self = this;
    const fakeInit = (metricsResponse) => {
      self.prometheusGraph.transformData(metricsResponse);
      self.prometheusGraph.createGraph();
    };
    spyOn(this.prometheusGraph, 'init').and.callFake(fakeInit);
  });

  it('initializes graph properties', () => {
    // Test for the measurements
    expect(this.prometheusGraph.margin).toBeDefined();
    expect(this.prometheusGraph.marginLabelContainer).toBeDefined();
    expect(this.prometheusGraph.originalWidth).toBeDefined();
    expect(this.prometheusGraph.originalHeight).toBeDefined();
    expect(this.prometheusGraph.height).toBeDefined();
    expect(this.prometheusGraph.width).toBeDefined();
    expect(this.prometheusGraph.backOffRequestCounter).toBeDefined();
    // Test for the graph properties (colors, radius, etc.)
    expect(this.prometheusGraph.graphSpecificProperties).toBeDefined();
    expect(this.prometheusGraph.commonGraphProperties).toBeDefined();
  });

  it('transforms the data', () => {
    this.prometheusGraph.init(prometheusMockData.metrics);
    expect(this.prometheusGraph.data).toBeDefined();
    expect(this.prometheusGraph.data.cpu_values.length).toBe(121);
    expect(this.prometheusGraph.data.memory_values.length).toBe(121);
  });

  it('creates two graphs', () => {
    this.prometheusGraph.init(prometheusMockData.metrics);
    expect($(prometheusGraphContainer).length).toBe(2);
  });

  describe('Graph contents', () => {
    beforeEach(() => {
      this.prometheusGraph.init(prometheusMockData.metrics);
    });

    it('has axis, an area, a line and a overlay', () => {
      const $graphContainer = $(prometheusGraphContents).find('.x-axis').parent();
      expect($graphContainer.find('.x-axis')).toBeDefined();
      expect($graphContainer.find('.y-axis')).toBeDefined();
      expect($graphContainer.find('.prometheus-graph-overlay')).toBeDefined();
      expect($graphContainer.find('.metric-line')).toBeDefined();
      expect($graphContainer.find('.metric-area')).toBeDefined();
    });

    it('has legends, labels and an extra axis that labels the metrics', () => {
      const $prometheusGraphContents = $(prometheusGraphContents);
      const $axisLabelContainer = $(prometheusGraphContents).find('.label-x-axis-line').parent();
      expect($prometheusGraphContents.find('.label-x-axis-line')).toBeDefined();
      expect($prometheusGraphContents.find('.label-y-axis-line')).toBeDefined();
      expect($prometheusGraphContents.find('.label-axis-text')).toBeDefined();
      expect($prometheusGraphContents.find('.rect-axis-text')).toBeDefined();
      expect($axisLabelContainer.find('rect').length).toBe(2);
      expect($axisLabelContainer.find('text').length).toBe(4);
    });
  });
});
