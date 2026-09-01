import { StuTest } from "./index";

describe("TestAna analysis actions", () => {
  beforeEach(() => {
    window.open = jest.fn();
  });

  it("分析总览去批改时进入考试的统一批改页", () => {
    const component = new StuTest({
      contractVersion: "V2",
      examId: 2069,
      paperId: 11689,
    });

    component.goToCorrectionRemark();

    expect(window.open).toHaveBeenCalledWith(
      `${window.location.origin}/exam#/correctionRemark/2069`,
    );
  });
});
