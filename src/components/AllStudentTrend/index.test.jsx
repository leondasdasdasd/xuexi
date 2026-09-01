/** @jest-environment-options {"url": "http://task.local.yungu-inc.org"} */
import { Chart } from "@antv/g2";

import ConnectedAllStudentTrend from "./index";

jest.mock("@antv/g2", () => ({
  Chart: jest.fn(),
}));

const AllStudentTrend = ConnectedAllStudentTrend.WrappedComponent;
const chartInstances = [];

/**
 * 创建支持成绩趋势图调用链的 G2 测试实例。
 * @param {object} options 需要覆盖的图表实例属性。
 * @returns {object} 可记录生命周期和配置调用的图表实例。
 */
function createChartInstance(options) {
  const line = {
    color: jest.fn().mockReturnThis(),
    label: jest.fn().mockReturnThis(),
    position: jest.fn().mockReturnThis(),
    shape: jest.fn().mockReturnThis(),
    size: jest.fn().mockReturnThis(),
  };
  return {
    axis: jest.fn(),
    clear: jest.fn(),
    destroy: jest.fn(),
    legend: jest.fn(),
    line: jest.fn(() => line),
    on: jest.fn(),
    render: jest.fn(),
    scale: jest.fn(),
    source: jest.fn(),
    tooltip: jest.fn(),
    ...options,
  };
}

/**
 * 创建可直接执行成绩趋势绘制方法的组件实例。
 * @param {object} properties 需要覆盖的组件属性。
 * @returns {AllStudentTrend} 成绩趋势组件实例。
 */
function createComponent(properties) {
  const component = new AllStudentTrend({
    newTrendList: {
      trendAnalysisResultModelList: [
        {
          examAverageScoreRate: "70%",
          examName: "七年级期末评估",
          examRanking: "3",
          examScoreRate: "80%",
        },
      ],
    },
    ...properties,
  });
  component.state.subjectId = 13;
  return component;
}

describe("学生成绩趋势图生命周期", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="trendNode"></div>';
    global.$ = jest.fn(() => ({
      find: jest.fn(() => ({
        remove: jest.fn(),
      })),
    }));
    Chart.mockReset();
    chartInstances.splice(0, chartInstances.length);
    Chart.mockImplementation(() => {
      const chartInstance = createChartInstance({});
      chartInstances.push(chartInstance);
      return chartInstance;
    });
  });

  afterEach(() => {
    delete global.$;
    document.body.innerHTML = "";
  });

  it("重绘前完整销毁上一个成绩趋势图", () => {
    const component = createComponent({});

    component.renderChart();
    const firstChart = chartInstances[0];
    component.renderChart();

    expect(firstChart.destroy).toHaveBeenCalledTimes(1);
  });

  it("关闭 G2 默认 crosshairs 以保证 HTML tooltip 可渲染", () => {
    const component = createComponent({});

    component.renderChart();
    const currentChart = chartInstances[0];

    expect(currentChart.tooltip).toHaveBeenCalledWith(
      expect.objectContaining({
        crosshairs: false,
        useHtml: true,
      }),
    );
  });

  it("首次绘制异常后再次绘制会销毁半成品图表", () => {
    const component = createComponent({});
    const firstChart = createChartInstance({
      render: jest.fn(() => {
        throw new Error("模拟 G2 绘制异常");
      }),
    });
    Chart.mockImplementationOnce(() => {
      chartInstances.push(firstChart);
      return firstChart;
    });

    expect(() => component.renderChart()).toThrow("模拟 G2 绘制异常");
    component.renderChart();

    expect(firstChart.destroy).toHaveBeenCalledTimes(1);
  });

  it("组件卸载时销毁当前成绩趋势图", () => {
    const component = createComponent({});

    component.renderChart();
    const currentChart = chartInstances[0];
    component.componentWillUnmount();

    expect(currentChart.destroy).toHaveBeenCalledTimes(1);
  });
});
