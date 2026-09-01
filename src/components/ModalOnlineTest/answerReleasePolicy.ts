import moment from "moment";

export const ANSWER_RELEASE_MODE = {
  IMMEDIATE: "IMMEDIATE",
  NEVER: "NEVER",
  SCHEDULED: "SCHEDULED",
} as const;

export const ANSWER_RELEASE_POLICY_ERROR = {
  RELEASE_TIME_NOT_FUTURE: "ANSWER_RELEASE_TIME_NOT_FUTURE",
  RELEASE_TIME_REQUIRED: "ANSWER_RELEASE_TIME_REQUIRED",
} as const;

export type AnswerReleaseMode =
  (typeof ANSWER_RELEASE_MODE)[keyof typeof ANSWER_RELEASE_MODE];

type AnswerReleasePolicy = {
  mode: AnswerReleaseMode;
  releaseTime: string;
};

type ExamVisibility = {
  examOpenShowTime: string | null;
  openAnswer: boolean;
};

const RELEASE_TIME_FORMAT = "YYYY-MM-DD HH:mm";

const releaseTimestamp = (value: string) => {
  const parsed = moment(value, RELEASE_TIME_FORMAT, true);
  return parsed.isValid() ? parsed.valueOf() : null;
};

export const mapExamVisibilityToAnswerReleasePolicy = ({
  examOpenShowTime,
  now = Date.now(),
  openAnswer,
}: {
  examOpenShowTime?: string | null;
  now?: number;
  openAnswer?: boolean | null;
}): AnswerReleasePolicy => {
  if (openAnswer === false) {
    return { mode: ANSWER_RELEASE_MODE.NEVER, releaseTime: "" };
  }
  const releaseTime = examOpenShowTime || "";
  const timestamp = releaseTimestamp(releaseTime);
  if (timestamp !== null && timestamp > now) {
    return { mode: ANSWER_RELEASE_MODE.SCHEDULED, releaseTime };
  }
  return { mode: ANSWER_RELEASE_MODE.IMMEDIATE, releaseTime: "" };
};

export const mapAnswerReleasePolicyToExamVisibility = ({
  mode,
  now = Date.now(),
  releaseTime,
}: AnswerReleasePolicy & { now?: number }): ExamVisibility => {
  if (mode === ANSWER_RELEASE_MODE.NEVER) {
    return { examOpenShowTime: null, openAnswer: false };
  }
  if (mode === ANSWER_RELEASE_MODE.IMMEDIATE) {
    return { examOpenShowTime: null, openAnswer: true };
  }
  const timestamp = releaseTimestamp(releaseTime);
  if (timestamp === null) {
    throw new Error(ANSWER_RELEASE_POLICY_ERROR.RELEASE_TIME_REQUIRED);
  }
  if (timestamp <= now) {
    throw new Error(ANSWER_RELEASE_POLICY_ERROR.RELEASE_TIME_NOT_FUTURE);
  }
  return { examOpenShowTime: releaseTime, openAnswer: true };
};

export { RELEASE_TIME_FORMAT };
