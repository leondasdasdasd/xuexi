import {
  assignMissingQuestionUuids,
  assignMissingTaskResultQuestionUuids,
} from "./questionTaskUuidModel";

const createUuidFactory = (event) => {
  void event;
  const state = {
    index: 0,
  };

  return (innerEvent) => {
    void innerEvent;
    state.index += 1;
    return `generated-uuid-${state.index}`;
  };
};

describe("QuestionTask uuid normalization", () => {
  it("fills only missing uuids on one question tree", () => {
    const result = assignMissingQuestionUuids(
      {
        sonQuestionList: [
          {
            uuid: "kept-child-uuid",
          },
          {},
        ],
        uuid: "",
      },
      createUuidFactory(),
    );

    expect(result.uuid).toBe("generated-uuid-2");
    expect(result.sonQuestionList[0].uuid).toBe("kept-child-uuid");
    expect(result.sonQuestionList[1].uuid).toBe("generated-uuid-1");
  });

  it("normalizes task result pages without touching existing uuids", () => {
    const result = assignMissingTaskResultQuestionUuids(
      {
        pages: [
          {
            questions: [
              {
                sonQuestionList: [{}],
                uuid: "kept-parent-uuid",
              },
              {},
            ],
          },
        ],
      },
      createUuidFactory(),
    );

    expect(result.pages[0].questions[0].uuid).toBe("kept-parent-uuid");
    expect(result.pages[0].questions[0].sonQuestionList[0].uuid).toBe(
      "generated-uuid-1",
    );
    expect(result.pages[0].questions[1].uuid).toBe("generated-uuid-2");
  });
});
