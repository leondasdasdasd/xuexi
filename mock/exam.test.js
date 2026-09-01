import {
  createScoreImportTemplateInstructionRows,
  createScoreImportTemplateSheetList,
  createScoreImportTemplateXlsx,
  mockQuestionTemplate,
} from "./exam.mjs";

/**
 *
 * @param zipBuffer
 * @param targetFileName
 */
function getZipFileText(zipBuffer, targetFileName) {
  const localFileHeaderSignature = 67_324_752;
  let offset = 0;
  while (offset < zipBuffer.length - 30) {
    if (zipBuffer.readUInt32LE(offset) !== localFileHeaderSignature) {
      break;
    }
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraLength = zipBuffer.readUInt16LE(offset + 28);
    const fileNameStart = offset + 30;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = zipBuffer.toString("utf8", fileNameStart, fileNameEnd);
    const dataStart = fileNameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (fileName === targetFileName) {
      return zipBuffer.toString("utf8", dataStart, dataEnd);
    }
    offset = dataEnd;
  }
  return "";
}

/**
 *
 * @param sheetXml
 * @param cellReference
 */
function getCellText(sheetXml, cellReference) {
  const cellStart = sheetXml.indexOf(`<c r="${cellReference}"`);
  if (cellStart < 0) {
    return "";
  }
  const textStart = sheetXml.indexOf("<t>", cellStart);
  const textEnd = sheetXml.indexOf("</t>", textStart);
  return textStart >= 0 && textEnd >= 0
    ? sheetXml.slice(textStart + 3, textEnd)
    : "";
}

describe("score import template mock", () => {
  it("puts instructions and AI prompt before score worksheets", () => {
    const rows = createScoreImportTemplateInstructionRows(
      { importMode: "append" },
      ["语文", "数学"],
    );
    const text = rows.flat().join("\n");

    expect(rows[0]).toEqual(["成绩导入模板填写说明", ""]);
    expect(text).toContain("AI 提示词");
    expect(text).toContain("系统下载的当前考试原始成绩文件");
    expect(text).toContain("也可以补充各学科单题得分");
    expect(text).toContain("原始文件有 A/B/C/D、AB、AC 等选项时必须保留选项");
    expect(text).toContain("不要把选项强行换算成分数");
    expect(text).toContain("不要丢失任何选项");
    expect(createScoreImportTemplateSheetList(["语文", "数学"])).toEqual([
      { name: "填写说明" },
      { name: "1_学科得分" },
      { name: "语文_小题得分" },
      { name: "数学_小题得分" },
      { name: "__系统配置", hidden: true },
    ]);
  });

  it("uses both single-choice and multi-choice questions in the template", () => {
    const choiceQuestions = mockQuestionTemplate.slice(0, 8);

    expect(choiceQuestions.map((question) => question.questionType)).toEqual([
      "单选",
      "单选",
      "单选",
      "单选",
      "多选",
      "多选",
      "多选",
      "多选",
    ]);
    expect(
      choiceQuestions.slice(4).map((question) => question.correctAnswer),
    ).toEqual(["AB", "AC", "BD", "ABC"]);
  });

  it("prefills existing scores when downloading for batch score edits", () => {
    const workbookBuffer = createScoreImportTemplateXlsx({
      importMode: "append",
      subjectConfigListString: JSON.stringify([
        {
          subjectId: 1,
          subjectName: "语文",
          groupIdList: [101],
          groupNameList: ["三一班"],
          fullScore: 150,
        },
      ]),
    });
    const scoreSheetXml = getZipFileText(
      workbookBuffer,
      "xl/worksheets/sheet2.xml",
    );
    const questionSheetXml = getZipFileText(
      workbookBuffer,
      "xl/worksheets/sheet3.xml",
    );

    expect(getCellText(scoreSheetXml, "D2")).not.toBe("");
    expect(getCellText(scoreSheetXml, "E2")).not.toBe("");
    expect(getCellText(questionSheetXml, "D8")).toBe("0");
    expect(getCellText(questionSheetXml, "E8")).toBe("B");
  });
});
