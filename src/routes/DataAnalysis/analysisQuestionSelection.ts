export interface AnalysisQuestionSource {
  questionId?: number | null;
  questionSerialNumber?: number | string | null;
  sonQuestionList?: AnalysisQuestionSource[] | null;
  [key: string]: unknown;
}

export interface AnalysisQuestionSelection {
  questionId: number;
  questionNo: number | string | null;
  sourceQuestion: AnalysisQuestionSource;
}

/**
 * 将分析接口题目归一为详情请求和 V2 冻结题目渲染共享的身份。
 * 复合题沿用既有业务规则，以首个子题作为可作答、可统计的冻结题目。
 * @param {AnalysisQuestionSource | null | undefined} sourceQuestion 分析接口返回的根题。
 * @returns {AnalysisQuestionSelection | null} 可请求、可渲染的统一题目身份。
 */
export const resolveAnalysisQuestionSelection = (
  sourceQuestion: AnalysisQuestionSource | null | undefined,
): AnalysisQuestionSelection | null => {
  if (!sourceQuestion) return null;
  const answerableQuestion =
    sourceQuestion.sonQuestionList?.[0] ?? sourceQuestion;
  if (
    typeof answerableQuestion.questionId !== "number" ||
    !Number.isInteger(answerableQuestion.questionId) ||
    answerableQuestion.questionId <= 0
  )
    return null;

  return {
    questionId: answerableQuestion.questionId,
    questionNo: answerableQuestion.questionSerialNumber ?? null,
    sourceQuestion,
  };
};
