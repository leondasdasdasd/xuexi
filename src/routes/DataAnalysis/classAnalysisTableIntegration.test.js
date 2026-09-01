import fs from "node:fs";
import path from "node:path";

describe("班级分析历史考试表格", () => {
  const source = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  const rankingTableSource = fs.readFileSync(
    path.join(__dirname, "../../components/Table/rankingtable.jsx"),
    "utf8",
  );

  it("使用班级名称稳定关联班级行", () => {
    expect(source).toMatch(
      /dataSource=\{newArrayDataSource\}[\s\S]*?rowKey="gradeAndGroupName"/,
    );
  });

  it("Popover 使用组件默认的弹层容器函数", () => {
    expect(source).not.toContain("getPopupContainer={false}");
  });

  it("分层图明确关闭旧版 G2 不兼容的 Tooltip 十字线", () => {
    expect(rankingTableSource).toMatch(
      /chart2\.tooltip\(\{[\s\S]*?crosshairs: null,/,
    );
  });
});
