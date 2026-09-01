// 批改页"下一份学生 / 是否全部批改完成"的纯逻辑。
// 输入数据形状与服务端 getMeCheckQuestionUserForResult / questionImageForResult 响应一致：
//   学生项：{ studentId, pending, ... }
//   题目项：{ questionId, studentScore, questionType, sonQuestionList? }
// 拆成纯函数以便单测，并避免组件内出现多套并行判断逻辑。

// 组合题题型：其 sonQuestionList 才是真正参与评分的子题
const COMBINATION_QUESTION_TYPE = 6;

/**
 * 展开题目列表：组合题展开为其子题，便于跨题型统一遍历。
 * @param {Array} questions 题目列表
 * @returns {Array} 展开后的题目数组（组合题被替换为其子题）
 */
export const flattenQuestions = (questions = []) =>
  questions.flatMap((item) =>
    item.questionType === COMBINATION_QUESTION_TYPE
      ? item.sonQuestionList || []
      : item,
  );

/**
 * 是否所有题目（含组合题子题）都已批改。
 * studentScore 为 0 视为已批改，仅 null / undefined / "" 视为未批改。
 * 空题目列表返回 false（没有题目不应判定为"已全部批改"）。
 * @param {Array} questions 题目列表
 * @returns {boolean} 是否全部已批改
 */
export const hasGradedAllQuestions = (questions = []) => {
  const flat = flattenQuestions(questions);
  if (flat.length === 0) {
    return false;
  }
  return flat.every((item) => item.studentScore || item.studentScore === 0);
};

/**
 * 选取下一个待批改学生：在 pending 学生中排除刚批完的当前学生，
 * 避免服务端 pending 状态短暂滞后导致回跳到同一个学生形成卡顿循环。
 * @param {Array} studentList 学生列表（含 pending 字段）
 * @param {number|string} currentStudentId 当前（刚批完）学生 id
 * @returns {object|undefined} 下一个待批改学生；不存在则返回 undefined
 */
export const pickNextPendingStudent = (studentList = [], currentStudentId) =>
  studentList.find(
    (item) => item.pending && item.studentId !== currentStudentId,
  );
