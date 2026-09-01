import React, { PureComponent } from "react";
import { Input, Select, Table } from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Search } = Input;
const { Option } = Select;
class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      hoverIndexID: null,
    };
  }
  componentDidMount() {}
  onRow = (row, index) => {
    return {
      onClick: (event) => {
        // console.log(row, index, "www");
        let state = Object.assign({}, this.state);
        state[`hoverIndex${this.props.hoverIndex}`] = false;
        console.log(this.props.hoverIndex, state, row.questionId, "sasa");
        this.setState(
          {
            ...state,
            hoverIndexID: row.questionId,
          },
          () => {
            this.props
              .dispatch({
                type: "home/hoverIndex",
                payload: {
                  hoverIndex: row.questionId,
                },
              })
              .then(() => {
                // let state = Object.assign({}, this.state);
                state[`hoverIndex${row.questionId}`] = true;
                // state[`hoverIndex${this.props.hoverIndex}`] = false;
                // console.log(state, "sasa1");
                this.setState({
                  ...state,
                  hoverIndexID: row.questionId,
                });
              });
          },
        );
      },
    };
  };
  render() {
    const { errDetialList, title } = this.props;
    const newcolumns = [
      {
        title: trans("singleInput.knowledgeTree", "知识点") + "：" + title,
        dataIndex: "name",
        key: "name",
        width: "70%",
        render: (text, record, index) => {
          // console.log(hoverIndexID, record.questionId, "222zwl");
          let numberRow = (record.answerFormat - 0) * 20;
          return {
            children: (
              <div
                // style={
                //   this.state[`hoverIndex${record.questionId}`]
                //     ? { border: "1px solid rgba(151,151,151,0.70)" }
                //     : null
                // }
                className={[
                  styles.rowBox,
                  this.state[`hoverIndex${record.questionId}`]
                    ? styles.blurBorder
                    : "",
                ].join(" ")}
                id={`question${record.questionId}`}
              >
                <div className={styles.questName} style={{ display: "flex" }}>
                  {/* <span>{record.questionSerialNumber}.</span> */}
                  <div
                    dangerouslySetInnerHTML={{ __html: record.content }}
                    style={{
                      marginBottom: "10px",
                      flex: "1",
                    }}
                  ></div>
                </div>

                {record.type == 1 || record.type == 2 ? (
                  <>
                    <div
                      className={styles.questName}
                      style={{ paddingLeft: "25px" }}
                    >
                      {record.optionList &&
                        record.optionList.length &&
                        record.optionList.map((it) => (
                          <div
                            key={it}
                            dangerouslySetInnerHTML={{
                              __html: `${it.answers}`,
                            }}
                            style={{
                              marginRight: "10px",
                            }}
                          ></div>
                        ))}
                    </div>
                  </>
                ) : null}
                {/* {this.state[`hoverIndex${record.questionId}`] ? (
                <span className={styles.markExempt}>
                  {trans("global.markExempt", "标记为免做")}
                </span>
              ) : null} */}
                <div style={{ height: numberRow }}></div>
                {this.state[`hoverIndex${record.questionId}`] ? (
                  <>
                    <div className={styles.noOperate}>
                      <span>
                        <i className={icon.iconfont}>&#xe798;</i>
                        {record.examName}
                      </span>
                      {record.type === 1 ? (
                        <span
                          className={[
                            styles.questionType1,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe761;</i>
                          {trans("global.radio", "单选题")}
                        </span>
                      ) : record.type === 2 ? (
                        <span
                          className={[
                            styles.questionType2,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe755;</i>
                          {trans("global.check", "多选题")}
                        </span>
                      ) : record.type === 3 ? (
                        <span
                          className={[
                            styles.questionType3,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe802;</i>
                          {trans("global.pack", "填空题")}
                        </span>
                      ) : record.type === 4 ? (
                        <span
                          className={[
                            styles.questionType4,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe800;</i>
                          {trans("global.judge", "判断题")}
                        </span>
                      ) : (
                        <span
                          className={[
                            styles.questionType5,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont} style={{ fontSize: 12 }}>
                            &#xe807;
                          </i>
                          {trans("global.ask", "问答题")}
                        </span>
                      )}
                      <span className={styles.inlineDifficulty}>
                        {record.questionLevel == 1
                          ? trans("global.easy", "简单")
                          : record.questionLevel == 2
                            ? trans("global.general", "普通")
                            : trans("global.difficult", "困难")}
                      </span>
                    </div>
                    <div className={styles.operateRow}></div>
                  </>
                ) : null}
                <div style={{ marginBottom: 20, display: "none" }}>
                  <span>
                    <i className={icon.iconfont}>&#xe798;</i>
                    {record.examName}
                  </span>
                  {record.type === 1 ? (
                    <span
                      className={[
                        styles.questionType1,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe761;</i>
                      {trans("global.radio", "单选题")}
                    </span>
                  ) : record.type === 2 ? (
                    <span
                      className={[
                        styles.questionType2,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe755;</i>
                      {trans("global.check", "多选题")}
                    </span>
                  ) : record.type === 3 ? (
                    <span
                      className={[
                        styles.questionType3,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe802;</i>
                      {trans("global.pack", "填空题")}
                    </span>
                  ) : record.type === 4 ? (
                    <span
                      className={[
                        styles.questionType4,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe800;</i>
                      {trans("global.judge", "判断题")}
                    </span>
                  ) : (
                    <span
                      className={[
                        styles.questionType5,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont} style={{ fontSize: 12 }}>
                        &#xe807;
                      </i>
                      {trans("global.ask", "问答题")}
                    </span>
                  )}
                  <span className={styles.inlineDifficulty}>
                    {record.questionLevel == 1
                      ? trans("global.easy", "简单")
                      : record.questionLevel == 2
                        ? trans("global.general", "普通")
                        : trans("global.difficult", "困难")}
                  </span>
                </div>
              </div>
            ),
            // props: {
            //   colSpan: hoverIndexID == record.questionId ? 2 : 1,
            // },
          };
        },
      },
      // {
      //   title: errorAnalysisTitle,
      //   dataIndex: "age",
      //   key: "age",
      // },
    ];
    return (
      <div className={styles.errorTable}>
        <Table
          columns={newcolumns}
          dataSource={errDetialList}
          bordered={true}
          align={"center"}
          pagination={false}
          onRow={this.onRow}
        />
      </div>
    );
  }
}
export default connect(({ home, global }) => ({
  hoverIndex: home.hoverIndex,
}))(GlobalHeader);
