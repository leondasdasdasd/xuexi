import * as echarts from "echarts";

import ScoreTable from "./scoreTable";

jest.mock("echarts", () => ({
  init: jest.fn(() => ({ setOption: jest.fn() })),
}));

describe("ScoreTable", () => {
  it("does not initialize or iterate a stacked chart for an empty analysis", () => {
    document.body.innerHTML = '<div id="pile"></div>';
    const Component = ScoreTable.WrappedComponent;
    const component = new Component({
      questionScore: { scoreSectionAnalyseRowList: [] },
    });

    expect(() => component.renderChartPile()).not.toThrow();
    expect(echarts.init).not.toHaveBeenCalled();
  });

  it("does not initialize a stacked chart for an incomplete row matrix", () => {
    document.body.innerHTML = '<div id="pile"></div>';
    const Component = ScoreTable.WrappedComponent;
    const component = new Component({
      questionScore: {
        scoreSectionAnalyseRowList: [
          { scoreSectionAnalyseRow: [{ scoreRate: "50%" }] },
          { groupName: "第二行" },
        ],
      },
    });

    expect(() => component.renderChartPile()).not.toThrow();
    expect(echarts.init).not.toHaveBeenCalled();
  });
});
