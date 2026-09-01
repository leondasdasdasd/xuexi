//新闻
import React, { Fragment, PureComponent } from "react";
import { Icon, Input, Popover, Radio, Switch, Tree } from "antd";

import { trans } from "../../../utils/i18n";

import styles from "./KnowledgeChapterTree.module.less";
const { TreeNode } = Tree;

class KnowledgeChapterTree extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  componentDidMount() {}

  renderTreeNodes = (data) => {
    const { searchVal } = this.props;
    return data.map((item) => {
      const index = item.title.indexOf(searchVal);
      const beforeString = item.title.slice(0, Math.max(0, index));
      const afterString = item.title.slice(index + searchVal.length);
      const title =
        index > -1 ? (
          <span>
            {beforeString}
            <span style={{ color: "#f50" }}>{searchVal}</span>
            {afterString}
          </span>
        ) : (
          <span>{item.title}</span>
        );
      if (item.children) {
        return (
          <TreeNode title={title} key={item.id}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.id} title={title} {...item} />;
    });
  };

  onTabChange = (value) => {
    this.props.onTabChange && this.props.onTabChange(value);
  };

  onTextbookChange = (value) => {
    this.props.onTextbookChange && this.props.onTextbookChange(value);
  };

  onGradeChange = (value) => {
    this.props.onGradeChange && this.props.onGradeChange(value);
  };
  render() {
    return (
      <div className={styles.leftContent}>
        <div className={styles.header}>
          <div className={styles.tabWarp}>
            <div
              className={`${styles.tab_item}`}
              onClick={() => {
                this.onTabChange(1);
              }}
            >
              <span className={this.props.tabKey == 1 ? styles.active : ""}>
                {trans("newMyQuestion.chapterSelection", "章节选题")}
              </span>
            </div>
            <div
              className={styles.tab_item}
              onClick={() => {
                this.onTabChange(2);
              }}
            >
              <span className={this.props.tabKey == 2 ? styles.active : ""}>
                {trans("newMyQuestion.knowledgeSelection", "知识点选题")}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.treeWarp}>
          {this.props.tabKey == 2 ? (
            <>
              <div style={{ width: "296px", marginTop: "13px" }}>
                <Input
                  placeholder={trans(
                    "newMyQuestion.searchKnowledge",
                    "搜索知识点",
                  )}
                  onChange={this.props.knowledgeTreeSearch}
                />
              </div>
              <div className={styles.threeOptionBox}>
                <div
                  style={{
                    marginRight: "auto",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {trans("newMyQuestion.knowledgeMultiSelect", "知识点多选")}{" "}
                    &nbsp;
                  </span>
                  <Switch
                    onChange={(checked) => {
                      this.props.knowledgeMultipleChange &&
                        this.props.knowledgeMultipleChange(checked);
                    }}
                    checked={this.props.knowledgeMultiple}
                  />
                </div>
                <Radio.Group
                  onChange={(e) => {
                    this.props.onToggleSetMode &&
                      this.props.onToggleSetMode(e.target.value);
                  }}
                  value={this.props.operationType}
                >
                  <Radio value={2}>
                    {trans("newMyQuestion.intersection", "交集")}
                  </Radio>
                  <Radio value={1}>
                    {trans("newMyQuestion.union", "并集")}
                  </Radio>
                </Radio.Group>
              </div>
            </>
          ) : (
            <div className={styles.searchInputWarp}>
              <Popover
                trigger="click"
                placement="bottomLeft"
                overlayClassName={styles.hidden_popover_arrow}
                content={
                  <div
                    style={{
                      width: "300px",
                      fontFamily: "PingFang SC",
                      fontSize: "14px",
                      color: "rgba(1, 17, 61, 0.85)",
                    }}
                  >
                    <div style={{ fontWeight: "600", marginBottom: "10px" }}>
                      {trans("newMyQuestion.textbookVersion", "教材版本")}
                    </div>
                    <div
                      style={{ display: "flex", marginBottom: "20px" }}
                      className={styles.textBoxContent}
                    >
                      {this.props.editionAndGradeData?.teachingList?.map(
                        (item) => {
                          return (
                            <div
                              key={item.id}
                              style={{
                                marginRight: "10px",
                                whiteSpace: "nowrap",
                                cursor: "pointer",
                              }}
                              className={
                                this.props?.teachingMaterial.id == item.id
                                  ? styles.active
                                  : ""
                              }
                              onClick={() => {
                                this.onTextbookChange(item);
                              }}
                            >
                              {item.name}
                            </div>
                          );
                        },
                      )}
                    </div>
                    <div style={{ fontWeight: "600", marginBottom: "10px" }}>
                      {trans("global.grade", "年级")}
                    </div>
                    <div
                      style={{ display: "flex" }}
                      className={styles.gradeContent}
                    >
                      {this.props.editionAndGradeData?.gradeList?.map(
                        (item) => {
                          return (
                            <div
                              key={item.gradeId}
                              style={{
                                marginRight: "10px",
                                whiteSpace: "nowrap",
                                cursor: "pointer",
                              }}
                              className={
                                this.props?.textBoxGrade?.gradeId ==
                                item.gradeId
                                  ? styles.active
                                  : ""
                              }
                              onClick={() => {
                                this.onGradeChange(item);
                              }}
                            >
                              {item.name}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                }
              >
                <div className={styles.searchInput}>
                  {this.props?.teachingMaterial?.name}：
                  {this.props?.textBoxGrade?.name}
                  <span style={{ float: "right", fontSize: "11px" }}>
                    <Icon type="down" />
                  </span>
                </div>
              </Popover>
            </div>
          )}
          <div
            style={{
              height: `calc(100% - ${this.props.tabKey == 1 ? "56px" : "90px"})`,
              overflowY: "auto",
              width: "100%",
            }}
          >
            {this.props.tabKey == 1 &&
            this.props.chapterList &&
            this.props.chapterList.length > 0 ? (
              <Tree
                showLine={true}
                showIcon={false}
                onExpand={this.props.onChExpand}
                expandedKeys={this.props.chExpandedKeys}
                selectedKeys={this.props.chapterIds}
                onSelect={(selectedKeys, info) => {
                  this.props.onSelect(selectedKeys, info, "ch");
                }}
                autoExpandParent={true}
              >
                {this.renderTreeNodes(this.props.chapterList)}
              </Tree>
            ) : null}
            {this.props.tabKey == 2 &&
            this.props.treeData &&
            this.props.treeData.length > 0 ? (
              <Tree
                showLine={true}
                showIcon={false}
                checkable={this.props.knowledgeMultiple}
                onExpand={this.props.onKnExpand}
                expandedKeys={this.props.knExpandedKeys}
                selectedKeys={this.props.knowlegeIds}
                checkedKeys={this.props.checkKnowledgeids}
                onSelect={(selectedKeys, info) => {
                  this.props.onSelect(selectedKeys, info, "kn");
                }}
                onCheck={(checkedKeys, info) => {
                  this.props.onCheck(checkedKeys, info, "kn");
                }}
                autoExpandParent={true}
              >
                {this.renderTreeNodes(this.props.treeData)}
              </Tree>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default KnowledgeChapterTree;
