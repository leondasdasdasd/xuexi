import React, { PureComponent } from "react";
import { Input, Select, Spin, Table } from "antd";
import { connect } from "dva";
import { DraggableAreasGroup } from "react-draggable-tags";

import { locale, trans } from "../../utils/i18n";

import "viewerjs-react/dist/index.css";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const group = new DraggableAreasGroup();
const DraggableArea2 = group.addArea();
const DraggableArea3 = group.addArea();
const DraggableArea4 = group.addArea();
const DraggableArea5 = group.addArea();
const DraggableArea6 = group.addArea();
const DraggableArea7 = group.addArea();
const DraggableArea8 = group.addArea();
const DraggableArea9 = group.addArea();
const DraggableArea10 = group.addArea();
const DraggableArea11 = group.addArea();
const { Option } = Select;
const { Search } = Input;
const { Column } = Table;

const colorList = [
  "rgba(254, 53, 5, 0.65)",
  "rgba(252, 131, 18, 0.65)",
  "rgba(243, 198, 23, 0.65)",
  "rgba(5, 230, 87, 0.65)",
  "rgba(4, 69, 252, 0.65)",
  "rgba(18, 204, 252, 0.65)",
  "rgba(81, 18, 252, 0.65)",
  "rgba(254, 53, 5, 0.65)",
  "rgba(252, 131, 18, 0.65)",
  "rgba(243, 198, 23, 0.65)",
];
const backList = [
  "rgba(254, 53, 5, 0.05)",
  "rgba(252, 131, 18, 0.05)",
  "rgba(252, 233, 18, 0.05)",
  "rgba(5, 230, 87, 0.05)",
  "rgba(4, 69, 252, 0.05)",
  "rgba(18, 204, 252, 0.05)",
  "rgba(81, 18, 252, 0.05)",
  "rgba(254, 53, 5, 0.05)",
  "rgba(252, 131, 18, 0.05)",
  "rgba(252, 233, 18, 0.05)",
];
const dropList = [
  "A组",
  "B组",
  "C组",
  "D组",
  "E组",
  "F组",
  "G组",
  "H组",
  "I组",
  "J组",
];
class StudentGroup extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      wrongQuestionList: [],
      groupList: [],
      groupSize: "5",
      wrongQuestionAnalysis: {},
      isFull: false,
      isShow: true,
      spinning: false,
    };
    this.isLoad = false;
    this.imgRef = React.createRef();
  }
  componentDidMount() {
    this.props.dispatch({
      type: "home/getWrongQuestion",
      payload: {
        examId: this.props.examId,
        groupIdList: this.state.groupList,
      },
    });
    this.props
      .dispatch({
        type: "home/getGroupResult",
        payload: {
          examId: this.props.examId,
        },
      })
      .then(() => {
        const { wrongQuestionAnalysis } = this.props;
        let newState = JSON.parse(JSON.stringify(this.state));
        if (
          wrongQuestionAnalysis.groupResult &&
          wrongQuestionAnalysis.groupResult.length > 0
        ) {
          wrongQuestionAnalysis.groupResult.map((item, index) => {
            newState[`tagList${index}`] = [];
            if (item.length > 0) {
              item.map((index_, ind) => {
                newState[`tagList${index}`].push({
                  id: index_.studentId,
                  data: index_,
                  content: (
                    <div
                      className={[styles.inlineGroup, styles.imgDrop].join(" ")}
                    >
                      {/* <div className={styles.imgBack} style={{backgroundImage: `url(${i.studentPhotoUrl}),url("https://assets.yungu.org/statics/0.0.1/task/boy.png")`}}>
                  </div> */}
                      <div
                        className={[styles.stuNameBox, `bgColor${index}`].join(
                          " ",
                        )}
                      >
                        {language ? index_.studentName : index_.studentEName}
                      </div>
                    </div>
                  ),
                });
              });
            }
          });
        }
        this.setState({
          ...newState,
          wrongQuestionList: wrongQuestionAnalysis.itemIds || [],
          groupSize: wrongQuestionAnalysis.groupSize
            ? JSON.stringify(wrongQuestionAnalysis.groupSize)
            : "5",
          groupList: wrongQuestionAnalysis.groupId,
          wrongQuestionAnalysis,
        });
      });
    this.props.dispatch({
      type: "home/getClass",
      payload: {
        examId: this.props.examId,
      },
    });
  }
  chooseGroupSize = (value) => {
    console.log(value, "vv");
    this.setState(
      {
        groupSize: value,
      },
      () => {
        this.startAnalysis();
      },
    );
  };
  chooseQuestion = (value) => {
    console.log(value, "vv");
    this.setState({
      wrongQuestionList: value,
    });
  };
  chooseGroup = (value) => {
    console.log(value, "vv");
    this.setState(
      {
        groupList: value,
      },
      () => {
        // console.log(this.state.groupList, "222");
        this.props.dispatch({
          type: "home/getWrongQuestion",
          payload: {
            examId: this.props.examId,
            groupIdList: value,
          },
        });
      },
    );
  };
  saveGroup = () => {
    let newWrongAnalysis = JSON.parse(
      JSON.stringify(this.state.wrongQuestionAnalysis),
    );
    let newList = [];
    newWrongAnalysis.groupResult.map((item, index) => {
      newList.push([]);
    });
    newWrongAnalysis.groupResult.map((item, index) => {
      this.state[`tagList${index}`].map((index_, ind) => {
        if (newList[index]) {
          newList[index].push(index_.data);
        } else {
          newList[index].push(index_.data);
        }
      });
    });
    newList.map((item, index) => {
      newWrongAnalysis.groupResult[index] = item;
    });
    console.log(newWrongAnalysis, "nn");
    if (this.isLoad) {
      return;
    }
    this.props
      .dispatch({
        type: "home/saveGroup",
        payload: {
          ...newWrongAnalysis,
        },
      })
      .then(() => {
        this.isLoad = false;
        this.props
          .dispatch({
            type: "home/getGroupResult",
            payload: {
              examId: this.props.examId,
            },
          })
          .then(() => {
            const { wrongQuestionAnalysis } = this.props;
            let newState = JSON.parse(JSON.stringify(this.state));
            if (
              wrongQuestionAnalysis.groupResult &&
              wrongQuestionAnalysis.groupResult.length > 0
            ) {
              wrongQuestionAnalysis.groupResult.map((item, index) => {
                newState[`tagList${index}`] = [];
                if (item.length > 0) {
                  item.map((index_, ind) => {
                    newState[`tagList${index}`].push({
                      id: index_.studentId,
                      data: index_,
                      content: (
                        <div
                          className={[styles.inlineGroup, styles.imgDrop].join(
                            " ",
                          )}
                        >
                          {/* <div className={styles.imgBack} style={{backgroundImage: `url(${i.studentPhotoUrl}),url("https://assets.yungu.org/statics/0.0.1/task/boy.png")`}}>
                    </div> */}
                          <div
                            className={[
                              styles.stuNameBox,
                              `bgColor${index}`,
                            ].join(" ")}
                          >
                            {language
                              ? index_.studentName
                              : index_.studentEName}
                          </div>
                        </div>
                      ),
                    });
                  });
                }
              });
            }
            this.setState(
              {
                ...newState,
                wrongQuestionList: wrongQuestionAnalysis.itemIds || [],
                groupSize: wrongQuestionAnalysis.groupSize
                  ? JSON.stringify(wrongQuestionAnalysis.groupSize)
                  : "5",
                groupList: wrongQuestionAnalysis.groupId,
                wrongQuestionAnalysis,
                isShow: !this.state.isShow,
              },
              () => {
                this.setState({
                  isShow: !this.state.isShow,
                });
              },
            );
          });
      });
  };
  startAnalysis = () => {
    if (this.state.spinning) {
      return;
    }
    this.setState({
      spinning: true,
    });
    this.props
      .dispatch({
        type: "home/getWrongQuestionAnalysis",
        payload: {
          examId: this.props.examId,
          itemIds: this.state.wrongQuestionList,
          groupId: this.state.groupList,
          groupSize: this.state.groupSize,
        },
      })
      .then(() => {
        let newState = JSON.parse(JSON.stringify(this.state));
        newState.spinning = false;
        const { wrongQuestionAnalysis } = this.props;
        if (
          wrongQuestionAnalysis.groupResult &&
          wrongQuestionAnalysis.groupResult.length > 0
        ) {
          wrongQuestionAnalysis.groupResult.map((item, index) => {
            newState[`tagList${index}`] = [];
            if (item.length > 0) {
              item.map((index_, ind) => {
                newState[`tagList${index}`].push({
                  id: index_.studentId,
                  data: index_,
                  content: (
                    <div
                      className={[styles.inlineGroup, styles.imgDrop].join(" ")}
                    >
                      {/* <div className={styles.imgBack} style={{backgroundImage: `url(${i.studentPhotoUrl}),url("https://assets.yungu.org/statics/0.0.1/task/boy.png")`}} /> */}
                      <div
                        className={[styles.stuNameBox, `bgColor${index}`].join(
                          " ",
                        )}
                      >
                        {language ? index_.studentName : index_.studentEName}
                      </div>
                    </div>
                  ),
                });
              });
            }
          });
        }
        this.setState({
          ...newState,
          wrongQuestionAnalysis: this.props.wrongQuestionAnalysis,
        });
      });
  };
  renderDrag = (index) => {
    console.log(this.state[`tagList${index}`], "555");
    switch (index) {
      case 0: {
        return (
          <DraggableArea2
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              console.log(leftTags, "ll");
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 1: {
        return (
          <DraggableArea3
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              console.log(leftTags, "ll1");

              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              // let trueColor = null;
              // if(leftTags.length > newState[`tagList${index}`].length) {
              //   for (let i = 0; i < leftTags.length; i++) {
              //     const element = leftTags[i];
              //     if(i === 0) {
              //       console.log(leftTags[i].content.props.children.props.style.backgroundColor, 'as');
              //       trueColor = leftTags[i].content.props.children.props.style.backgroundColor;
              //     } else {
              //       if(leftTags[i].content.props.children.props.style.backgroundColor === leftTags[i-1].content.props.children.props.style.backgroundColor) {
              //         trueColor = leftTags[i].content.props.children.props.style.backgroundColor;
              //       }
              //     }
              //   }
              //   console.log(trueColor, 'asa')
              //   for (let i = 0; i < leftTags.length; i++) {
              //     leftTags[i].content.props.children.props.style.backgroundColor = trueColor;
              //   }
              // }
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 2: {
        return (
          <DraggableArea4
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 3: {
        return (
          <DraggableArea5
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 4: {
        return (
          <DraggableArea6
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 5: {
        return (
          <DraggableArea7
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 6: {
        return (
          <DraggableArea8
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 7: {
        return (
          <DraggableArea9
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 8: {
        return (
          <DraggableArea10
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      case 9: {
        return (
          <DraggableArea11
            tags={this.state[`tagList${index}`]}
            render={({ tag }) => <div className="tag">{tag.content}</div>}
            onChange={(leftTags) => {
              this.isLoad = !this.isLoad;
              const newState = JSON.parse(JSON.stringify(this.state));
              newState[`tagList${index}`] = leftTags;
              this.setState({ ...newState }, () => {
                this.saveGroup();
              });
            }}
          />
        );
      }
      // No default
    }
  };
  changeFull = () => {
    this.setState(
      {
        isFull: !this.state.isFull,
      },
      () => {
        this.props.changeFull(this.state.isFull);
      },
    );
  };
  // ondropNew = (ev, index, ind) => {
  //   console.log(index, ind)
  // }
  // ondragstartNew = (ev, index, ind) => {
  //   console.log(ev, index, ind, 'start');
  // }
  // ondragover =  (ev, index, ind) => {
  //   console.log(ev, index, ind, 'over');
  // }
  // ondragleaveNew = (ev, index, ind) => {
  //   console.log(ev, index, ind, 'leave');
  // }
  // ondragenterNew = (ev, index, ind) => {
  //   console.log(ev, index, ind, 'enter');
  // }

  render() {
    const { wrongQuestion, tableClass } = this.props;
    const {
      wrongQuestionList,
      groupList,
      groupSize,
      wrongQuestionAnalysis,
      isFull,
    } = this.state;
    console.log(this.state.isShow);
    let dataSource = [];
    if (
      wrongQuestionAnalysis &&
      wrongQuestionAnalysis.otherStudent &&
      wrongQuestionAnalysis.otherStudent.length > 0
    ) {
      wrongQuestionAnalysis.otherStudent.map((item) => {
        dataSource.push({
          name: language ? item.studentName : item.studentEName,
          wrongQuestions:
            item.wrongQuestions && item.wrongQuestions.length > 0
              ? item.wrongQuestions.join(",")
              : "",
          rightQuestions:
            item.rightQuestions && item.rightQuestions.length > 0
              ? item.rightQuestions.join(",")
              : "",
        });
      });
    }
    const columns = [
      {
        title: (
          <div>
            {trans("global.remainingGroupStudents", "剩余组学生（{$num}）人", {
              num:
                (wrongQuestionAnalysis.otherStudent &&
                  wrongQuestionAnalysis.otherStudent.length) ||
                0,
            })}
          </div>
        ),
        dataIndex: "name",
        key: "name",
      },
      {
        title: trans("glbal.rightNum", "答对题目"),
        dataIndex: "rightQuestions",
        key: "rightQuestions",
      },
      {
        title: trans("glbal.wrongNum", "答对题目"),
        dataIndex: "wrongQuestions",
        key: "wrongQuestions",
      },
    ];
    console.log(wrongQuestion, "qqq");
    return (
      <div
        className={[styles.stuGroup, isFull ? styles.fullGroup : ""].join(" ")}
      >
        <div
          className={[
            styles.chooseStuBox,
            isFull ? styles.displayNone : "",
          ].join(" ")}
        >
          <div className={styles.groupTitle}>
            <span
              className={[styles.titleBox, styles.inlineGroup].join(" ")}
            ></span>
            <span className={styles.inlineGroup}>
              {trans("global.chooseStu&WrongQuestion", "选择高频错题&学生")}
            </span>
          </div>
          <div className={styles.chooseStuContent}>
            <div>
              <div className={styles.stuContentTitle}>
                {trans("global.selectStudent", "选择学生")}
              </div>
              <Select
                mode="multiple"
                style={{ width: "300px", height: "70px" }}
                placeholder={trans("global.selectStudent", "选择学生")}
                value={groupList}
                onChange={this.chooseGroup}
              >
                {tableClass && tableClass.length > 0
                  ? tableClass.map((item) => (
                      <Option key={item.groupId}>
                        {language ? item.groupName : item.groupEnName}
                      </Option>
                    ))
                  : null}
              </Select>
            </div>
            <div>
              <div className={styles.stuContentTitle}>
                {trans("global.chooseWrongQuestion", "选择高频错题")}
              </div>
              <Select
                mode="multiple"
                style={{ width: "320px", minHeight: "70px" }}
                placeholder={trans(
                  "global.should",
                  "可以输入多个题目做交叉分析，题目已按照得分率从低到高排序",
                )}
                value={wrongQuestionList}
                onChange={this.chooseQuestion}
              >
                {wrongQuestion && wrongQuestion.length > 0
                  ? wrongQuestion.map((item) => (
                      <Option key={item.questionNumber}>
                        <p>
                          <span>{item.questionNumber}</span>
                          <sapn
                            style={{
                              // float: "right",
                              color: "#ccc",
                              marginLeft: "10px",
                            }}
                          >
                            {item.scoreRate}%
                          </sapn>
                        </p>
                      </Option>
                    ))
                  : null}
              </Select>
            </div>
            <div className={styles.startContent}>
              <div className={styles.startBtn} onClick={this.startAnalysis}>
                {trans("global.startAnalysis", "开始分析")}
              </div>
            </div>
          </div>
        </div>
        <Spin spinning={this.state.spinning}>
          <div
            className={[
              styles.stuAnswerBox,
              isFull ? styles.displayNone : "",
            ].join(" ")}
          >
            <div className={styles.groupTitle}>
              <span
                className={[styles.titleBox, styles.inlineGroup].join(" ")}
              ></span>
              <span className={styles.inlineGroup}>
                {trans("global.stuAnswerTable", "学生答题分布")}
              </span>
            </div>
            {wrongQuestionAnalysis && wrongQuestionAnalysis.allQuestionRight ? (
              <div className={styles.stuAnswerContent}>
                <div className={styles.fakeTable}>
                  <div
                    className={[styles.fakeTableTitle, styles.wrongTitle].join(
                      " ",
                    )}
                  >
                    {trans("global.allRightStu", "全部答对（{$num}）人", {
                      num: wrongQuestionAnalysis.allQuestionRight.length || 0,
                    })}
                  </div>
                  <div className={styles.fakeItemList}>
                    {wrongQuestionAnalysis.allQuestionRight.map((item) => (
                      <div className={styles.fakeTableItem}>
                        {language ? item.studentName : item.studentEName}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.fakeTable}>
                  <div
                    className={[styles.fakeTableTitle, styles.rightTitle].join(
                      " ",
                    )}
                  >
                    {trans("global.allWrongStu", "全部答错（{$num}）人", {
                      num: wrongQuestionAnalysis.allQuestionWrong.length || 0,
                    })}
                  </div>
                  <div className={styles.fakeItemList}>
                    {wrongQuestionAnalysis.allQuestionWrong &&
                      wrongQuestionAnalysis.allQuestionWrong.map((item) => (
                        <div className={styles.fakeTableItem}>
                          {language ? item.studentName : item.studentEName}
                        </div>
                      ))}
                  </div>
                </div>
                <div className={styles.otherTable}>
                  <Table
                    dataSource={dataSource}
                    columns={columns}
                    scroll={{ y: 240 }}
                    pagination={false}
                  />
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </Spin>
        <div
          className={[styles.stuDropBox, isFull ? styles.moHeight : ""].join(
            " ",
          )}
        >
          <div className={styles.groupTitle}>
            <span
              className={[styles.titleBox, styles.inlineGroup].join(" ")}
            ></span>
            <span className={[styles.inlineGroup].join(" ")}>
              {trans("global.stuDrop", "学生分组")}
            </span>
            {/* <Alert message="拖动学生头像可以调整分组哦" type="info" showIcon /> */}
            <span
              className={[styles.inlineGroup, styles.inLineMessage].join(" ")}
            >
              {trans("global.tips1", "(拖动学生头像可以调整分组哦)")}
            </span>
            <span className={styles.chooseGroupBox}>
              <span
                className={[styles.inlineGroup, styles.groupCount].join(" ")}
              >
                {trans("global.groupCount", "分组数")}
              </span>
              <Select
                placeholder={trans("global.pleaseChoose", "请选择")}
                style={{ width: "100px", height: "20px" }}
                value={groupSize}
                onChange={this.chooseGroupSize}
              >
                <Option key={2}>{trans("global.twoGroup", "2组")}</Option>
                <Option key={3}>{trans("global.threeGroup", "3组")}</Option>
                <Option key={4}>{trans("global.fourGroup", "4组")}</Option>
                <Option key={5}>{trans("global.fiveGroup", "5组")}</Option>
                <Option key={6}>{trans("global.sixGroup", "6组")}</Option>
                <Option key={7}>{trans("global.sevenGroup", "7组")}</Option>
                <Option key={8}>{trans("global.eightGroup", "8组")}</Option>
                <Option key={9}>{trans("global.nineGroup", "9组")}</Option>
                <Option key={10}>{trans("global.tenGroup", "10组")}</Option>
              </Select>
            </span>
            <span className={styles.fullBox} onClick={this.changeFull}>
              {isFull ? (
                <i className={[styles.iconfont, styles.fullIcon].join(" ")}>
                  &#xe80e;
                </i>
              ) : (
                <i className={[styles.iconfont, styles.fullIcon].join(" ")}>
                  &#xe80d;
                </i>
              )}
            </span>
          </div>
          <div className={styles.dropContent}>
            {wrongQuestionAnalysis.groupResult &&
            wrongQuestionAnalysis.groupResult.length > 0
              ? wrongQuestionAnalysis.groupResult.map((item, index) => (
                  <div className={styles.stuDropList}>
                    <div
                      className={styles.dropListGroup}
                      style={{ color: colorList[index] }}
                    >
                      {dropList[index]}
                    </div>
                    <div className={styles.dropListItem}>
                      {this.state.isShow && this.renderDrag(index)}
                    </div>
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    );
  }
}
export default connect(({ home }) => ({
  tableClass: home.tableClass,
  wrongQuestion: home.wrongQuestion,
  wrongQuestionAnalysis: home.wrongQuestionAnalysis,
}))(StudentGroup);
