import type { QuestionContentSerializedDraft } from "@yungu-fed/question-editor";

import type { PaperEditorDraft } from "../PaperEditor/types";
import { createAnalysisQuestionCatalog } from "./analysisQuestionCatalog";

const content = (id: number): QuestionContentSerializedDraft =>
  ({
    id,
    version: "1",
    businessQuestionTypeId: 5,
    questionTypeKey: "5",
    elements: [],
    extras: [],
    children: [],
  }) as unknown as QuestionContentSerializedDraft;

describe("createAnalysisQuestionCatalog", () => {
  it("indexes one canonical V2 tree with stable composite display numbers", () => {
    const draft = {
      title: "V2 paper",
      subjectId: 14,
      subjectName: "Math",
      questionTypeTemplates: [],
      modules: [
        {
          key: "module-0",
          title: "Composite",
          questions: [
            {
              key: "question-10",
              questionId: 10,
              score: 4,
              content: content(10),
              children: [
                {
                  key: "question-11",
                  questionId: 11,
                  score: 2,
                  content: content(11),
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    } as PaperEditorDraft;

    const catalog = createAnalysisQuestionCatalog(draft);

    expect(catalog.requireQuestion(10).displayNumber).toBe("1");
    expect(catalog.requireQuestion(11).displayNumber).toBe("1.1");
    expect(catalog.requireQuestion(11).content).toBe(
      draft.modules[0].questions[0].children[0].content,
    );
    expect(catalog.questionTypeTemplates).toBe(draft.questionTypeTemplates);
    expect(catalog.findQuestion(99)).toBeUndefined();
    expect(() => catalog.requireQuestion(99)).toThrow("questionId=99");
  });
});
