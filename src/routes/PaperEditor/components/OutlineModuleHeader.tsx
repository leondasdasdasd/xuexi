import React from "react";
import { Button, Dropdown, Icon, Menu, Popconfirm, Tooltip } from "antd";

import { trans } from "../../../utils/i18n";
import type { PaperModuleDraft } from "../types";
import OutlineModuleSummary from "./OutlineModuleSummary";

import styles from "../index.module.less";

interface Props {
  isFirst: boolean;
  isLast: boolean;
  module: PaperModuleDraft;
  moduleIndex: number;
  onAddLibraryQuestions: (
    moduleKey: string,
    initialQuestionTypeKey?: number,
  ) => void;
  onDeleteModule: (moduleKey: string) => void;
  onMoveModule: (oldIndex: number, newIndex: number) => void;
}

const getInitialQuestionTypeKey = (
  module: PaperModuleDraft,
): number | undefined => {
  const questionTypeKey = module.questions[0]?.content?.questionTypeKey;
  if (typeof questionTypeKey === "number") return questionTypeKey;
};

/**
 * 渲染右侧题块标题、题库添加与块排序入口，不承载题号导航。
 * @param {Props} properties 题块标题属性。
 * @returns {React.ReactElement} 题块标题行。
 */
function OutlineModuleHeader(properties: Props): React.ReactElement {
  const {
    isFirst,
    isLast,
    module,
    moduleIndex,
    onAddLibraryQuestions,
    onDeleteModule,
    onMoveModule,
  } = properties;
  const initialQuestionTypeKey = getInitialQuestionTypeKey(module);
  const addFromLibraryLabel = trans(
    "paperEditor.addFromLibrary",
    "从题库添加题目",
  );
  const deleteModuleLabel = trans("paperEditor.deleteModule", "删除题块");
  const iconButtonClassName = styles["module-icon-button"];
  const deleteButtonClassName = `${iconButtonClassName} ${styles["module-delete-button"]}`;
  const sortMenu = (
    <Menu
      onClick={({ key }) =>
        onMoveModule(moduleIndex, moduleIndex + (key === "up" ? -1 : 1))
      }
    >
      <Menu.Item disabled={isFirst} key="up">
        {trans("paperEditor.moveModuleUp", "上移")}
      </Menu.Item>
      <Menu.Item disabled={isLast} key="down">
        {trans("paperEditor.moveModuleDown", "下移")}
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={styles["outline-module-header"]}>
      <strong className={styles["outline-module-title"]}>
        {moduleIndex + 1}. {module.title}
      </strong>
      <OutlineModuleSummary module={module} />
      <Tooltip title={addFromLibraryLabel}>
        <span className={styles["module-add-button-wrap"]}>
          <Button
            aria-label={addFromLibraryLabel}
            className={iconButtonClassName}
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onAddLibraryQuestions(module.key, initialQuestionTypeKey);
            }}
          >
            <Icon type="plus" />
          </Button>
        </span>
      </Tooltip>
      {module.questions.length > 0 ? (
        <Popconfirm
          cancelText={trans("global.cancel", "取消")}
          okText={trans("global.confirm", "确定")}
          title={trans(
            "paperEditor.deleteModuleConfirm",
            "删除题块将同时移除其中的全部题目，确定删除吗？",
          )}
          onConfirm={() => onDeleteModule(module.key)}
        >
          <Button
            aria-label={deleteModuleLabel}
            className={deleteButtonClassName}
            size="small"
          >
            <Icon type="delete" />
          </Button>
        </Popconfirm>
      ) : (
        <Tooltip title={deleteModuleLabel}>
          <Button
            aria-label={deleteModuleLabel}
            className={deleteButtonClassName}
            size="small"
            onClick={() => onDeleteModule(module.key)}
          >
            <Icon type="delete" />
          </Button>
        </Tooltip>
      )}
      <Dropdown overlay={sortMenu} placement="bottomRight" trigger={["click"]}>
        <Button
          aria-label={trans("paperEditor.sortModule", "调整块顺序")}
          className={`${iconButtonClassName} ${styles["module-sort-button"]}`}
          size="small"
        >
          <Icon type="swap" />
        </Button>
      </Dropdown>
    </div>
  );
}

export default OutlineModuleHeader;
