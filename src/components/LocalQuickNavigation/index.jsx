import React from "react";
import { Icon } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

const navigationItems = [
  {
    icon: "file-text",
    label: "试卷列表",
    path: "/testPaperManagement",
  },
  {
    icon: "profile",
    label: "测验列表",
    path: "/examAnalysis",
  },
  {
    icon: "database",
    label: "题库列表",
    path: "/V2QuestionList",
  },
  {
    icon: "fund",
    label: trans("global.adaptiveLearning", "自适应学习"),
    path: "/adaptive-learning",
  },
];

const LocalQuickNavigation = () => (
  <aside className={styles.container} aria-label="本地快捷导航">
    <button
      aria-label="本地快捷导航"
      className={styles.trigger}
      title="本地快捷导航"
      type="button"
    >
      <Icon aria-hidden="true" type="compass" />
    </button>
    <nav className={styles.menu} aria-label="列表快捷入口">
      {navigationItems.map(({ icon, label, path }) => (
        <a
          className={styles["menu-item"]}
          href={`#${path}`}
          key={path}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Icon aria-hidden="true" type={icon} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  </aside>
);

export default LocalQuickNavigation;
