import React, { PureComponent } from "react";
import { Input, Select } from "antd";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const { Option } = Select;
class FormHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  render() {
    const {
      gradeOptions,
      subjectOptions,
      categoryOptions,
      nameStr,
      formValues,
      onFormChange,
    } = this.props;
    const missingFields = [
      !formValues.grade && formValues.grade != 0
        ? trans("global.grade", "年级")
        : "",
      !formValues.subject && formValues.subject != 0
        ? trans("global.subject", "学科")
        : "",
      !formValues.category && formValues.category != 0
        ? trans("global.type", "题型")
        : "",
    ].filter(Boolean);
    const missingFieldsText = missingFields.join(
      locale() === "en" ? ", " : "、",
    );
    return (
      <div className={[styles.searchBox, styles.flexRow].join(" ")}>
        <span className={styles.inline}>
          <span className={styles.searchTitle}>
            {trans("global.grade", "年级")}
          </span>
          <Select
            onChange={(e) => onFormChange("grade", e)}
            value={formValues.grade}
            style={{ width: 120 }}
            placeholder={trans("global.pleaseChoose", "请选择")}
          >
            {gradeOptions && gradeOptions.length > 0
              ? gradeOptions.map((item) => (
                  <Option value={item.gradeId} key={item.gradeId}>
                    {item.name}
                  </Option>
                ))
              : null}
          </Select>
        </span>
        <span className={styles.inline}>
          <span className={styles.searchTitle}>
            {trans("global.subject", "学科")}
          </span>
          <Select
            value={formValues.subject}
            style={{ width: 120 }}
            onChange={(e) => onFormChange("subject", e)}
            placeholder={trans("global.pleaseChoose", "请选择")}
          >
            {subjectOptions && subjectOptions.length > 0
              ? subjectOptions.map((item) => (
                  <Option value={item.id} key={item.id}>
                    {item.name}
                  </Option>
                ))
              : null}
          </Select>
        </span>
        <span className={styles.inline}>
          <span className={styles.searchTitle}>
            {trans("global.type", "题型")}
          </span>
          <Select
            onChange={(e) => onFormChange("category", e)}
            style={{ width: 120 }}
            value={formValues.category}
            placeholder={trans("global.pleaseChoose", "请选择")}
          >
            {categoryOptions && categoryOptions.length > 0
              ? categoryOptions.map((item) => (
                  <Option value={item.code} key={item.code}>
                    {item.typeName}
                  </Option>
                ))
              : null}
          </Select>
        </span>
        <div className={[styles.flexRow, styles.titleBox].join(" ")}>
          <div className={styles.title}>{trans("twoWay.title")}</div>
          {nameStr ? (
            <div className={styles.titleContent}>
              {nameStr}
              {/* {baseExamNmae}{gradeName}{subname} */}
            </div>
          ) : null}
          <Input
            value={formValues.title}
            placeholder={trans("global.pleaseEnter", "请输入")}
            onChange={(e) => onFormChange("title", e)}
          />
        </div>
        {formValues.grade == undefined ||
        formValues.subject == undefined ||
        formValues.category == undefined ? (
          <div className={styles.placeholder}>
            <span className={styles.red}>*</span>
            {trans("twoWay.selectPaperMissingFields", "请选择试卷的{$fields}", {
              fields: missingFieldsText,
            })}
          </div>
        ) : null}
      </div>
    );
  }
}
export default FormHeader;
