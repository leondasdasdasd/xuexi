import {
  ANSWER_RELEASE_MODE,
  ANSWER_RELEASE_POLICY_ERROR,
  mapAnswerReleasePolicyToExamVisibility,
  mapExamVisibilityToAnswerReleasePolicy,
} from "./answerReleasePolicy";

const NOW = new Date("2026-08-20T10:00:00+08:00").getTime();

describe("online exam answer release policy", () => {
  it("maps historical visibility fields to one canonical mode", () => {
    expect(
      mapExamVisibilityToAnswerReleasePolicy({
        examOpenShowTime: "2026-08-20 11:00",
        now: NOW,
        openAnswer: false,
      }),
    ).toEqual({ mode: ANSWER_RELEASE_MODE.NEVER, releaseTime: "" });
    expect(
      mapExamVisibilityToAnswerReleasePolicy({
        examOpenShowTime: "2026-08-20 11:00",
        now: NOW,
        openAnswer: true,
      }),
    ).toEqual({
      mode: ANSWER_RELEASE_MODE.SCHEDULED,
      releaseTime: "2026-08-20 11:00",
    });
    expect(
      mapExamVisibilityToAnswerReleasePolicy({
        examOpenShowTime: "2026-08-20 09:00",
        now: NOW,
        openAnswer: true,
      }),
    ).toEqual({ mode: ANSWER_RELEASE_MODE.IMMEDIATE, releaseTime: "" });
  });

  it("maps the canonical mode to the established transport fields", () => {
    expect(
      mapAnswerReleasePolicyToExamVisibility({
        mode: ANSWER_RELEASE_MODE.IMMEDIATE,
        now: NOW,
        releaseTime: "",
      }),
    ).toEqual({ examOpenShowTime: null, openAnswer: true });
    expect(
      mapAnswerReleasePolicyToExamVisibility({
        mode: ANSWER_RELEASE_MODE.NEVER,
        now: NOW,
        releaseTime: "2026-08-20 11:00",
      }),
    ).toEqual({ examOpenShowTime: null, openAnswer: false });
    expect(
      mapAnswerReleasePolicyToExamVisibility({
        mode: ANSWER_RELEASE_MODE.SCHEDULED,
        now: NOW,
        releaseTime: "2026-08-20 11:00",
      }),
    ).toEqual({
      examOpenShowTime: "2026-08-20 11:00",
      openAnswer: true,
    });
  });

  it("requires a complete future time for scheduled release", () => {
    expect(() =>
      mapAnswerReleasePolicyToExamVisibility({
        mode: ANSWER_RELEASE_MODE.SCHEDULED,
        now: NOW,
        releaseTime: "",
      }),
    ).toThrow(ANSWER_RELEASE_POLICY_ERROR.RELEASE_TIME_REQUIRED);
    expect(() =>
      mapAnswerReleasePolicyToExamVisibility({
        mode: ANSWER_RELEASE_MODE.SCHEDULED,
        now: NOW,
        releaseTime: "2026-08-20 09:00",
      }),
    ).toThrow(ANSWER_RELEASE_POLICY_ERROR.RELEASE_TIME_NOT_FUTURE);
  });
});
