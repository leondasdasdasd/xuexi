import React, { useState } from "react";
import { Button, Input, Select } from "antd";

import { trans } from "../../../utils/i18n";

import styles from "./FilterBar.module.less";
const { Search } = Input;

const { Option } = Select;

/**
 *
 * @param properties
 */
function FilterBar(properties) {
  const {
    viewType,
    onTabChange,
    onSearch,
    onUpload,
    subjectOptions,
    gradeOptions,
    yearOptions,
    subjectValue,
    gradeValue,
    yearValue,
    onSubjectChange,
    onGradeChange,
    onYearChange,
  } = properties;
  const [searchValue, setSearchValue] = useState("");

  const searchKeywordChange = (value) => {
    setSearchValue(value);
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.left}>
        <div className={styles.tabs}>
          {[
            { label: trans("paper.filter.myPaper", "我的试卷"), value: 1 },
            { label: trans("paper.filter.schoolPaper", "校本试卷"), value: 2 },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.tab} ${viewType === item.value && styles.tabActive}`}
              onClick={() => onTabChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.filters}>
          <Select
            className={styles.select}
            value={subjectValue}
            onChange={onSubjectChange}
            dropdownMatchSelectWidth={false}
          >
            <Option value={null}>
              {trans("paper.filter.allSubject", "全部学科")}
            </Option>
            {(subjectOptions || []).map((item) => (
              <Option key={item.value} value={item.value}>
                {item.label}
              </Option>
            ))}
          </Select>

          <Select
            className={styles.select}
            value={gradeValue}
            onChange={onGradeChange}
            dropdownMatchSelectWidth={false}
          >
            <Option value={null}>
              {trans("paper.filter.allGrade", "全部年级")}
            </Option>
            {(gradeOptions || []).map((item) => (
              <Option key={item.value} value={item.value}>
                {item.label}
              </Option>
            ))}
          </Select>

          <Select
            className={styles.select}
            value={yearValue}
            onChange={onYearChange}
            dropdownMatchSelectWidth={false}
          >
            <Option value={null}>
              {trans("paper.filter.allYear", "全部年份")}
            </Option>
            {yearOptions.map((item) => (
              <Option key={item} value={item}>
                {item}
              </Option>
            ))}
          </Select>
        </div>

        <div className={styles.search}>
          <Search
            value={searchValue}
            allowClear
            placeholder={trans("paper.filter.searchPlaceholder", "搜索试卷")}
            onChange={(e) => searchKeywordChange(e.target.value)}
            onSearch={(value) => onSearch(value)}
            onPressEnter={(e) => onSearch(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
      </div>

      <div className={styles.right}>
        <Button type="primary" icon="upload" onClick={onUpload}>
          {trans("paper.filter.uploadPaper", "上传试卷")}
        </Button>
      </div>
    </div>
  );
}

export default FilterBar;
