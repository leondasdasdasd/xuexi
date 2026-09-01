import React, { PureComponent } from "react";
import { Checkbox, InputNumber, Popover, Select, TreeSelect } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";
const { Option } = Select;

class FooterActions extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  render() {
    const {
      onCheckAll,
      checked,
      disable,
      onFormChange,
      onSelectedRow,
      chapterTreeList,
      knowledgeTreeList,
      qualityTreeList,
    } = this.props;
    return (
      <div className={[styles.twoWayBottom, styles.flexRow].join(" ")}>
        <div className={styles.checkAll}>
          <Checkbox onChange={onCheckAll} checked={checked}>
            {trans("global.selectAll")}
          </Checkbox>
        </div>
        {disable ? (
          <div className={[styles.flexRow].join(" ")}>
            <Popover
              placement="top"
              title={null}
              content={
                <div className={styles.batchSCore}>
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(e) => {
                      onFormChange("predictionDifficulty", e);
                    }}
                  />
                </div>
              }
              trigger="click"
            >
              <div className={[styles.button].join(" ")}>
                {trans("global.predictionDifficult", "预测难度")}
              </div>
            </Popover>
            <Popover
              onVisibleChange={(e) => {
                if (e) {
                  setTimeout(() => {
                    const childElements = document.querySelectorAll(
                      "#questionLevelBox .ant-select-selection",
                    );
                    childElements[0].click();
                  }, 100);
                }
              }}
              placement="top"
              title={null}
              content={
                <div className={styles.batchSCore} id="questionLevelBox">
                  <Select
                    style={{ width: 90 }}
                    placeholder={trans("global.selectDifficulty", "选择难易")}
                    onChange={(e) => {
                      onFormChange("questionLevelType", e);
                    }}
                  >
                    <Option value={1}>{trans("global.easy", "简单")}</Option>
                    <Option value={2}>{trans("global.general", "普通")}</Option>
                    <Option value={3}>
                      {trans("global.difficult", "困难")}
                    </Option>
                  </Select>
                </div>
              }
              trigger="click"
            >
              <div className={[styles.button].join(" ")}>
                {trans("global.selectDifficult", "选择难易")}
              </div>
            </Popover>

            <Popover
              placement="top"
              title={null}
              onVisibleChange={(e) => {
                if (e) {
                  setTimeout(() => {
                    const childElements = document.querySelectorAll(
                      "#sourceBox .ant-select-selection",
                    );
                    childElements[0].click();
                  }, 100);
                }
              }}
              content={
                <div className={styles.batchSCore} id="sourceBox">
                  <Select
                    style={{ width: 90 }}
                    placeholder={trans("global.selectSource", "选择来源")}
                    onChange={(e) => {
                      onFormChange("sourceType", e);
                    }}
                  >
                    <Option value={1}>
                      {trans("global.Originalquestion", "原题")}
                    </Option>
                    <Option value={2}>
                      {trans("global.original", "原创")}
                    </Option>
                    <Option value={3}>{trans("global.adapt", "改编")}</Option>
                  </Select>
                </div>
              }
              trigger="click"
            >
              <div className={[styles.button].join(" ")}>
                {trans("global.selectSource", "预测难度")}
              </div>
            </Popover>

            {/* 添加章节 */}
            <Popover
              placement="top"
              title={null}
              onVisibleChange={(e) => {
                if (e) {
                  setTimeout(() => {
                    const childElements = document.querySelectorAll(
                      "#chapterTreeSelect .ant-select-selection",
                    );
                    childElements[0].click();
                  }, 100);
                }
              }}
              content={
                <div className={styles.ifChild} id="chapterTreeSelect">
                  <TreeSelect
                    treeNodeFilterProp="searchKey"
                    treeCheckStrictly
                    treeCheckable
                    treeData={chapterTreeList}
                    treeDefaultExpandAll
                    onChange={(value, node, extra) => {
                      onFormChange("chapter", value, node, extra);
                    }}
                    style={{ minWidth: "200px" }}
                  />
                </div>
              }
              trigger="click"
            >
              <div
                className={[styles.button].join(" ")}
                onClick={() => {
                  onSelectedRow("chapter");
                }}
              >
                {trans("global.addChapter")}
              </div>
            </Popover>

            {/* 添加知识点 */}
            <Popover
              placement="top"
              title={null}
              onVisibleChange={(e) => {
                if (e) {
                  setTimeout(() => {
                    const childElements = document.querySelectorAll(
                      "#knowledgeTreeSelect .ant-select-selection",
                    );
                    childElements[0].click();
                  }, 100);
                }
              }}
              content={
                <div className={styles.ifChild} id="knowledgeTreeSelect">
                  <TreeSelect
                    treeCheckStrictly
                    treeNodeFilterProp="searchKey"
                    treeCheckable
                    treeData={knowledgeTreeList}
                    treeDefaultExpandAll
                    onChange={(value, node, extra) => {
                      onFormChange("knowledge", value, node, extra);
                    }}
                    style={{ minWidth: "200px" }}
                  />
                </div>
              }
              trigger="click"
            >
              <div
                className={[styles.button].join(" ")}
                onClick={() => {
                  onSelectedRow("knowledge");
                }}
              >
                {trans("global.addKnowledge")}
              </div>
            </Popover>

            {/* 添加素养 */}
            <Popover
              placement="top"
              title={null}
              onVisibleChange={(e) => {
                if (e) {
                  setTimeout(() => {
                    const childElements = document.querySelectorAll(
                      "#labelTreeSelect .ant-select-selection",
                    );
                    childElements[0].click();
                  }, 100);
                }
              }}
              content={
                <div className={styles.ifChild} id="labelTreeSelect">
                  <TreeSelect
                    treeCheckStrictly
                    treeNodeFilterProp="searchKey"
                    treeCheckable
                    treeData={qualityTreeList}
                    treeDefaultExpandAll
                    onChange={(value, node, extra) => {
                      onFormChange("quality", value, node, extra);
                    }}
                    style={{ minWidth: "200px" }}
                  />
                </div>
              }
              trigger="click"
            >
              <div
                className={[styles.button].join(" ")}
                onClick={() => {
                  onSelectedRow("quality");
                }}
              >
                {trans("global.addAttainment")}
              </div>
            </Popover>
            {/* <Popover
                    placement="top"
                    title={null}
                    onVisibleChange={(e) => {
                      if (e) {
                        setTimeout(() => {
                          const childElements = document.querySelectorAll('#isChildQuestionSelect .ant-select-selection');
                          childElements[0].click()
                        }, 100)
                      }
                    }}
                    content={
                      <div className={styles.ifChild} id="isChildQuestionSelect">
                        <Select value={this.state.isChild} style={{ width: 60 }} onChange={this.batchDifficult.bind(this, 'isChild')}>
                          <Option value={1}>是</Option>
                          <Option value={2}>否</Option>
                        </Select>
                      </div>
                    }
                    trigger="click">
                    <div className={[styles.button].join(' ')}>{trans('global.isChildQuestion')}</div>
                  </Popover> */}
          </div>
        ) : (
          <div className={[styles.flexRow].join(" ")}>
            <div className={[styles.noCheckButton].join(" ")}>
              {trans("global.predictionDifficult", "预测难度")}
            </div>
            <div className={[styles.noCheckButton].join(" ")}>
              {trans("global.selectDifficult", "选择难易")}
            </div>
            <div className={[styles.noCheckButton].join(" ")}>
              {trans("global.selectSource", "选择来源")}
            </div>
            <div className={[styles.noCheckButton].join(" ")}>
              {trans("global.addChapter", "添加章节")}
            </div>
            <div className={[styles.noCheckButton].join(" ")}>
              {trans("global.addKnowledge", "添加知识点")}
            </div>
            <div className={[styles.noCheckButton].join(" ")}>
              {trans("global.addAttainment", "添加素养")}
            </div>
            {/* <div className={[styles.noCheckButton].join(' ')}>{trans('global.isChildQuestion')}</div> */}
          </div>
        )}
      </div>
    );
  }
}
export default FooterActions;
