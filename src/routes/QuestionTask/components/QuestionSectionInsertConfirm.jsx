import React from "react";
import { Input, InputNumber, message, Modal } from "antd";

import { trans } from "../../../utils/i18n";

import styles from "./QuestionCardsView.module.less";

const SECTION_INSERT_FORM_CLASS_NAME = styles["section-insert-form"];
const SECTION_INSERT_FIELD_CLASS_NAME = styles["section-insert-field"];
const SECTION_INSERT_LABEL_CLASS_NAME = styles["section-insert-label"];
const SECTION_INSERT_CONTROL_CLASS_NAME = styles["section-insert-control"];

const isValidSectionNumber = (value) => {
  const sectionNumber = Number(value);

  return Number.isInteger(sectionNumber) && sectionNumber > 0;
};

const keepSectionInsertModalOpen = (messageKey, defaultMessage) => {
  message.error(trans(messageKey, defaultMessage));
  return true;
};

const renderSectionInsertModalContent = ({
  defaultSectionNumber,
  defaultSectionTitle,
  onSectionNameChange,
  onSectionNumberChange,
  sectionNamePlaceholder,
}) => (
  <div className={SECTION_INSERT_FORM_CLASS_NAME}>
    <label className={SECTION_INSERT_FIELD_CLASS_NAME}>
      <span className={SECTION_INSERT_LABEL_CLASS_NAME}>
        {trans("questionTask.sectionNumber", "分段编号")}
      </span>
      <InputNumber
        aria-label={trans("questionTask.sectionNumber", "分段编号")}
        className={SECTION_INSERT_CONTROL_CLASS_NAME}
        defaultValue={defaultSectionNumber}
        min={1}
        precision={0}
        placeholder={trans(
          "questionTask.sectionNumberPlaceholder",
          "请输入分段编号",
        )}
        onChange={onSectionNumberChange}
      />
    </label>
    <label className={SECTION_INSERT_FIELD_CLASS_NAME}>
      <span className={SECTION_INSERT_LABEL_CLASS_NAME}>
        {trans("questionTask.sectionName", "分段名")}
      </span>
      <Input
        aria-label={trans("questionTask.sectionName", "分段名")}
        className={SECTION_INSERT_CONTROL_CLASS_NAME}
        defaultValue={defaultSectionTitle}
        maxLength={100}
        placeholder={sectionNamePlaceholder}
        onChange={onSectionNameChange}
      />
    </label>
  </div>
);

export const openQuestionSectionInsertConfirm = ({
  defaultSectionNumber,
  defaultSectionTitle,
  getModalContainer,
  title,
  onConfirm,
}) => {
  const sectionDraftReference = {
    current: {
      sectionName: defaultSectionTitle || "",
      sectionNumber: defaultSectionNumber,
    },
  };

  Modal.confirm({
    cancelText: trans("global.cancel", "取消"),
    content: renderSectionInsertModalContent({
      defaultSectionNumber: sectionDraftReference.current.sectionNumber,
      defaultSectionTitle: sectionDraftReference.current.sectionName,
      onSectionNameChange: (event) => {
        sectionDraftReference.current = {
          ...sectionDraftReference.current,
          sectionName: event.target.value,
        };
      },
      onSectionNumberChange: (value) => {
        sectionDraftReference.current = {
          ...sectionDraftReference.current,
          sectionNumber: value,
        };
      },
      sectionNamePlaceholder: trans(
        "questionTask.sectionNamePlaceholder",
        "请输入分段名",
      ),
    }),
    getContainer: getModalContainer,
    icon: <></>,
    okText: trans("global.confirm", "确定"),
    title: title || trans("questionTask.insertSectionModalTitle", "新增分段"),
    onOk: (event) => {
      void event;
      const { sectionName, sectionNumber } = sectionDraftReference.current;

      if (!isValidSectionNumber(sectionNumber)) {
        return keepSectionInsertModalOpen(
          "questionTask.sectionNumberRequired",
          "请输入大于 0 的分段编号",
        );
      }

      const normalizedSectionName = String(sectionName || "").trim();

      if (!normalizedSectionName) {
        return keepSectionInsertModalOpen(
          "questionTask.sectionNameRequired",
          "请先输入分段名",
        );
      }

      onConfirm({
        sectionNumber: Number(sectionNumber),
        sectionTitle: normalizedSectionName,
      });
    },
  });
};
