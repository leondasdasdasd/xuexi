import { Icon } from "antd";

import { trans } from "../../../utils/i18n";

import styles from "../explicitExam.module.less";

const StudentUnavailablePaper = () => (
  <section className={styles["paper-unavailable"]}>
    <Icon type="file-unknown" />
    <h2>{trans("explicitExam.noAnswerableQuestions", "暂无可作答题目")}</h2>
    <p>
      {trans(
        "explicitExam.noAnswerableQuestionsDetail",
        "试卷题目暂时不可用，请返回并联系老师",
      )}
    </p>
  </section>
);

export default StudentUnavailablePaper;
