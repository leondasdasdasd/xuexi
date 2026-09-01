import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
const testAnalysisSource = fs.readFileSync(
  path.join(__dirname, "../../components/TestAna/index.jsx"),
  "utf8",
);
const paperDetailEditActionSource = fs.readFileSync(
  path.join(__dirname, "components/PaperDetailEditAction/index.tsx"),
  "utf8",
);

describe("data analysis V2 paper detail integration", () => {
  it("uses the shared V2 detail and current edit/trial routes", () => {
    expect(source).toContain("<DataAnalysisPaperDetail");
    expect(source).toContain("<PaperDetailEditAction");
    expect(source).toContain("paperEditDisabledReasonCode");
    expect(source).toContain("buildTeacherPaperTrialUrl");
    expect(paperDetailEditActionSource).toContain("buildPaperEditorEditPath");
    expect(paperDetailEditActionSource).toContain(
      "getPaperEditDisabledMessage",
    );
    expect(source).not.toContain("/detail/false/true/");
    expect(source).not.toContain(
      "case 1: {\n        return (\n          <div>\n",
    );
    expect(source).not.toContain("this.child && this.child.view(5)");
    expect(source).not.toContain("checkQuestionId");
    expect(source).not.toContain("this.props.analysisDetail.moduleList");
    expect(testAnalysisSource).not.toContain('type: "home/getTestView"');
    expect(testAnalysisSource).not.toContain("this.props.active === 1");
  });
});
