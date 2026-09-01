import { Icon } from "antd";

import { trans } from "../../../utils/i18n";
import type { ExamDateMetadata } from "../types";

import styles from "../explicitExam.module.less";

type Properties = {
  dateMetadata: ExamDateMetadata;
  gradeName: string;
  totalScore: string;
};

const ExamPaperMetadata = ({
  dateMetadata,
  gradeName,
  totalScore,
}: Properties) => (
  <div className={styles["paper-metadata"]}>
    <span>
      <Icon type="team" />
      {trans("global.grade", "年级")} {gradeName}
    </span>
    <span>
      <Icon type="calendar" />
      {dateMetadata.kind === "teacher-student-submission-time"
        ? trans("explicitExam.submissionDate", "交卷日期")
        : trans("explicitExam.date", "日期")}{" "}
      <time>{dateMetadata.displayText}</time>
    </span>
    <span>
      <Icon type="profile" />
      {trans("global.manfen", "满分")} {totalScore}
    </span>
  </div>
);

export default ExamPaperMetadata;
