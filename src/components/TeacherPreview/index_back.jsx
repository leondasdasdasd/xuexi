//新闻
import React, { Fragment, PureComponent } from "react";
import {
  Button,
  Dropdown,
  Icon,
  Input,
  Menu,
  Modal,
  Pagination,
  Popover,
  Radio,
  Tooltip,
} from "antd";
import { Guide } from "bizcharts";
import { connect } from "dva";
import { Link } from "dva/router";
import pathToRegexp from "path-to-regexp";

import AssentmentList from "components/AssentmentList";
import MultiSelect from "components/MultiSelect";
import ScreenInput from "components/ScreenInput";

import AchievementTable from "../../components/AchievementTable";
import DimensionTable from "../../components/DimensionTable/index.js";
import { trans } from "../../utils/i18n";

import "./index.module.less";
import "react-image-crop/dist/ReactCrop.css";
const { Text } = Guide;
const { TextArea } = Input;
const sliceNumber = 0.01;

class Home extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/home/:subject/:year/:lange").exec(this.url);
    this.subjectId = Number.parseInt(this.pathMatch[1], 10) || null;
    this.year = Number.parseInt(this.pathMatch[2], 10) || null;
    this.lange = this.pathMatch[3] || null;
    this.semesterId = null;
    this.semesterList = [this.year];
    this.state = {
      type: 9,
      id: 0,
      value: 1,
      visible: true,
      studentList: [],
      modalVisible: false,
      frameVisible: false,
      url: "",
      show: true,
      iptState: 0,
      defaultClass: 0,
      iptType: 1,
      class: [],
      pageNumber: 1,
      totalScore: null,
      openKey: 0,
      selectKey: 0,
      selectType: 9,
      text: "",
      pageSize: 20,
      clickOk: true,
      mask: false,
      itemVisible: false,
      stuId: null,
      itemId: null,
      scoreVisible: false,
      groupName: "",
    };
  }
  componentDidMount() {
    document.cookie = `evaluation-cookie-language=${this.lange}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
    const id = this.props.typeObj.selectId || this.state.id;
    const type = this.props.typeObj.selectType || this.state.type;
    const that = this;
    window.onmessage = (e) => {
      if (e.data.closeModal === "close") {
        parent.postMessage({ winFull: "close" }, "*");
        that.setState(
          {
            frameVisible: false,
            url: "",
          },
          () => {
            this.handleChange(true);
          },
        );
      }
    };
    if (this.props.typeObj.selectId) {
      this.setState({
        id: this.props.typeObj.selectId,
        type: this.props.typeObj.selectType,
      });
    }
    this.props
      .dispatch({
        type: "home/getSemester",
        payload: {
          schoolId: this.year,
        },
      })
      .then(() => {
        this.semesterId =
          this.props.semesterList.length > 0
            ? this.props.semesterList[this.props.semester].id
            : null;
        this.props.dispatch({
          type: "home/getSource",
          payload: {
            semesterId: this.semesterId,
            courseId: this.subjectId,
          },
        });
        this.props
          .dispatch({
            type: "home/getTableClass",
            payload: {
              semesterId: this.semesterId,
              courseId: this.subjectId,
            },
          })
          .then(() => {
            let tabList = [];
            this.props.tableClass.map((item) => {
              if (this.props.group) {
                if (item.id === this.props.group) {
                  tabList.push(item.id);
                  this.setState({
                    groupName: item.name,
                  });
                }
              } else {
                if (item.id === 0) {
                  this.setState({
                    groupName: item.name,
                  });
                } else {
                  tabList.push(item.id);
                }
              }
            });
            this.setState({
              class: tabList,
            });
            if (type === 9) {
              this.props.dispatch({
                type: "home/updateAchievementList",
                payload: {
                  courseId: this.subjectId,
                  semesterId: this.semesterId,
                  groupIds: tabList,
                  sortType: this.state.iptType,
                  pageNo: this.state.pageNumber,
                  pageSize: this.state.pageSize,
                },
              });
            } else if (type === 2) {
              this.props.dispatch({
                type: "home/queryTermList",
                payload: {
                  evaluationItemId: id,
                  sortType: this.state.iptType,
                  groupIds: tabList,
                  postStatus: this.state.iptState,
                  semesterId: this.semesterId,
                  pageNo: this.state.pageNumber,
                  pageSize: this.state.pageSize,
                },
              });
            } else {
              this.props.dispatch({
                type: "home/getStatisSource",
                payload: {
                  //will do
                },
              });
              // this.props.dispatch({
              //   type: 'home/queryChart',
              //   payload: {
              //     courseId: this.subjectId,
              //     semesterId: this.semesterId,
              //     schoolYearId: this.year,
              //     categoryId: id,
              //     sortType: this.state.iptType,
              //     groupIds: tabList,
              //     pageNo: this.state.pageNumber,
              //     pageSize: this.state.pageSize,
              //   }
              // })
              this.props.dispatch({
                type: "home/queryAllScore",
                payload: {
                  groupIds: tabList,
                  sortType: 1,
                  courseId: this.subjectId,
                  semesterId: this.semesterId,
                  schoolYearId: this.year,
                  categoryId: id,
                  pageNo: this.state.pageNumber,
                  pageSize: this.state.pageSize,
                },
              });
            }
          });
        //评价方案列表
        this.props.dispatch({
          type: "home/getEvaluationList",
          payload: {
            courseId: this.subjectId,
            semesterId: this.semesterId,
            // schoolYearId: 1,
            // categoryId: 1,
            // sortType: this.state.iptType,
            // groupIds: [1],
            // pageSize: 10,
            // pageNumber: this.state.pageNumber,
          },
        });
      });
  }
  exportEva = () => {
    this.props.dispatch({
      type: "home/exportEva",
      payload: {
        evaluationItemId: this.state.id,
        sortType: this.state.iptType,
        groupIds: this.state.class,
        postStatus: this.state.iptState,
        semesterId: this.semesterId,
      },
    });
  };
  groupChange = (value) => {
    this.setState(
      {
        defaultClass: Number.parseInt(value.key, 10),
      },
      () => {
        this.props.dispatch({
          type: "home/saveGroup",
          payload: this.state.defaultClass,
        });
        let list = [];
        if (this.state.defaultClass === 0) {
          this.props.tableClass.map((item) => {
            if (item.id !== 0) {
              list.push(item.id);
            }
          });
        } else {
          list.push(this.state.defaultClass);
        }
        this.props.tableClass.map((item) => {
          if (item.id === this.state.defaultClass) {
            this.setState({
              groupName: item.name,
            });
          }
        });
        const payload = {
          class: list,
        };
        this.queryTermList(payload);
      },
    );
  };
  scoreChange = (userId, stuId, e) => {
    this.props.dispatch({
      type: "home/addResult",
      payload: {
        evaluationItemId: this.state.id,
        id: userId,
        studentUserId: stuId,
        score: e.target.value,
        scoreType: 2,
      },
      onSuccess: () => {
        this.handleChange();
      },
    });
    this.setState({
      scoreVisible: false,
    });
    this.handleScoreVisible(false);
  };
  changeType = (object) => {
    this.setState(
      {
        id: object.selectId,
        type: object.selectType,
      },
      () => {
        this.handleChange();
      },
    );
  };
  showModal = (url) => {
    parent.postMessage({ winFull: "open" }, "*");
    this.setState(
      {
        url: url,
      },
      () => {
        this.setState({
          frameVisible: true,
        });
      },
    );
  };
  termScoreChange = (id, userId, stuId, indicatorId, e) => {
    const list = e.target.value.split("-");
    let listId = 0;
    this.props.termList.data.itemResultResponses.map((index) => {
      if (userId === index.id) {
        index.itemIndicatorResultModelList.map((item) => {
          if (id === item.indicatorId) {
            listId = item.id;
          }
        });
      }
    });
    // this.props.termList.data.itemResultResponses[0].itemIndicatorResultModelList.map(item => {
    //  if(id === item.indicatorId) {
    //    listId = item.id
    //   }
    // })
    this.props.dispatch({
      type: "home/addResult",
      payload: {
        evaluationItemId: this.state.id,
        id: userId,
        studentUserId: stuId,
        itemIndicatorResultRequests: {
          id: listId,
          score: list[1],
          indicatorId: indicatorId,
          criterionItemId: Number.parseInt(list[0], 10),
        },
      },
      onSuccess: () => {
        this.handleChange();
      },
    });
    this.setState({
      itemVisible: false,
    });
    this.handleVisibleChange(false);
  };
  searchStudent = () => {
    this.setState(
      {
        modalVisible: true,
      },
      () => {
        this.getBaseAll();
      },
    );
  };
  // headerClick = (id) => {
  //   this.props.dispatch({
  //     type: 'home/saveCloumId',
  //     payload: id
  //   })
  // }
  delteStudent = (id) => {
    let list = [];
    list.push(id);
    Modal.confirm({
      title: "",
      content: trans("global.sureDel", "是否确认删除该学生"),
      onOk: () => {
        this.props.dispatch({
          type: "home/deleteStu",
          payload: {
            evaluationItemId: this.state.id,
            studentIds: list,
          },
          onSuccess: () => {
            this.handleChange(true);
          },
        });
      },
      onCancel() {},
    });
  };
  submitStudent = (id) => {
    let list = [];
    list.push(id);
    Modal.confirm({
      title: "",
      content: trans(
        "global.sureSub",
        "确认要将评价结果发布给该学生？发布后，将给该学生推送一条消息通知。",
      ),
      onOk: () => {
        this.props.dispatch({
          type: "home/submitStu",
          payload: {
            evaluationItemId: this.state.id,
            studentIds: list,
            courseId: this.subjectId,
            semesterId: this.semesterId,
          },
          onSuccess: () => {
            this.handleChange();
          },
        });
      },
      onCancel() {},
    });
  };
  queryTermList = (pay) => {
    this.setState(
      {
        ...pay,
      },
      () => {
        this.handleChange(true);
      },
    );
  };
  termHeaderRender = (columnIndex) => {
    const { termList } = this.props;
    return termList.data.score ? (
      <div data-col={columnIndex}>
        {termList.data && columnIndex === 0 ? (
          <span className="">{trans("global.manfen", "满分")}</span>
        ) : termList.data.itemIndicatorRubricsResponses.length > 0 &&
          columnIndex <= termList.data.itemIndicatorRubricsResponses.length &&
          termList.data.itemIndicatorRubricsResponses[columnIndex - 1]
            .evaluationItemScaleModelResponse.scales.length > 0 ? (
          <span>
            {termList.data.itemIndicatorRubricsResponses[columnIndex - 1]
              .evaluationItemScaleModelResponse.scales[0][0].indicator || ""}
          </span>
        ) : columnIndex ===
          termList.data.itemIndicatorRubricsResponses.length + 1 ? (
          <span>{trans("global.feedback", "反馈")}</span>
        ) : columnIndex ===
          termList.data.itemIndicatorRubricsResponses.length + 2 ? (
          <span>{trans("global.study", "学习证据")}</span>
        ) : columnIndex ===
          termList.data.itemIndicatorRubricsResponses.length + 3 ? (
          <span>{trans("global.status", "状态")}</span>
        ) : columnIndex ===
          termList.data.itemIndicatorRubricsResponses.length + 4 ? (
          <span />
        ) : null}
      </div>
    ) : (
      <div data-col={columnIndex}>
        {termList.data.itemIndicatorRubricsResponses.length > 0 &&
        columnIndex < termList.data.itemIndicatorRubricsResponses.length &&
        termList.data.itemIndicatorRubricsResponses[columnIndex]
          .evaluationItemScaleModelResponse.scales.length > 0 ? (
          <span>
            {termList.data.itemIndicatorRubricsResponses[columnIndex]
              .evaluationItemScaleModelResponse.scales[0][0].indicator || ""}
          </span>
        ) : columnIndex ===
          termList.data.itemIndicatorRubricsResponses.length ? (
          <span>{trans("global.feedback", "反馈")}</span>
        ) : columnIndex ===
          termList.data.itemIndicatorRubricsResponses.length + 1 ? (
          <span>{trans("global.study", "学习证据")}</span>
        ) : columnIndex ===
          termList.data.itemIndicatorRubricsResponses.length + 2 ? (
          <span>{trans("global.status", "状态")}</span>
        ) : columnIndex ===
          termList.data.itemIndicatorRubricsResponses.length + 3 ? (
          <span />
        ) : null}
      </div>
    );
  };
  termLeftRender = (rowIndex) => {
    const { termList } = this.props;
    const headerPortrait =
      termList.data.itemResultResponses[rowIndex].headPortrait || "";
    return (
      <div data-row={rowIndex} className="leftList">
        {termList.data.itemResultResponses.length > 0 ? (
          <div className="userName">
            <div className="float">
              <img src={headerPortrait} />
            </div>
            <div>
              <span className="name">
                {termList.data.itemResultResponses[rowIndex].studentName}
              </span>
              <span className="enName">
                {termList.data.itemResultResponses[rowIndex].studentEName}
              </span>
              <div className="userNumber">
                {termList.data.itemResultResponses[rowIndex].studentNo}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };
  changeScore = (value, e) => {
    this.setState({
      totalScore: e.target.value,
    });
  };
  textChange = (e) => {
    this.setState({
      text: e.target.value,
    });
  };
  submitScore = (id, score, stuId, e) => {
    window.addEventListener("onBlur", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
    if (e.target.value === score) {
      return;
    }
    if (e.target.value === "" && !score) {
      return;
    }
    this.props.dispatch({
      type: "home/addResult",
      payload: {
        evaluationItemId: this.state.id,
        id: id,
        studentUserId: stuId,
        score: this.state.totalScore,
        scoreType: 1,
      },
      onSuccess: () => {
        this.handleChange();
      },
    });
    return false;
  };
  onfocus = () => {
    this.setState({
      clickOk: false,
      mask: true,
    });
  };
  setStu = (stuId, id) => {
    this.setState({
      stuId: stuId,
      itemId: id,
    });
  };
  handleVisibleChange = (visible) => {
    this.setState({ itemVisible: visible });
  };
  domEvaRender = (data, stu) => {
    const { scoreStandard, termList } = this.props;
    let termContent = <div>111</div>;
    termList.data.itemIndicatorRubricsResponses.length &&
      termList.data.itemIndicatorRubricsResponses.map((item) => {
        if (item.id === data.indicatorId) {
          termContent = (
            <div>
              {item.evaluationItemScaleModelResponse.scales.length > 0 &&
              item.evaluationItemScaleModelResponse.scales[0][0].items.length >
                0 ? (
                <Radio.Group
                  onChange={this.termScoreChange.bind(
                    this,
                    item.id,
                    stu.id,
                    stu.studentUserId,
                    data.indicatorId,
                  )}
                >
                  {item.evaluationItemScaleModelResponse.scales[0][0].items.map(
                    (index) => (
                      <div className="radioCheck scoreCheckBox">
                        <Radio value={`${index.id}-${index.level}`}>
                          {
                            <div className="inline">
                              {index.icon ? (
                                <div className="inline">
                                  <img
                                    src={index.icon}
                                    className="totalScoreImg"
                                  />
                                  <span>{index.level}</span>
                                </div>
                              ) : index.color ? (
                                <div
                                  style={{ backgroundColor: index.color }}
                                  className="inline radius"
                                >
                                  <span>{index.level}</span>
                                </div>
                              ) : null}
                              <span className="inline centerAilgn">
                                {index.description}
                              </span>
                            </div>
                          }
                        </Radio>
                      </div>
                    ),
                  )}
                </Radio.Group>
              ) : null}
            </div>
          );
        }
      });
    return (
      <Popover
        content={termContent}
        trigger="click"
        placement="bottomLeft"
        overlayStyle={{ width: "auto", zIndex: 20, maxWidth: 500 }}
        getPopupContainer={() => document.querySelectorAll(".home_body")[0]}
        visible={
          this.state.itemVisible &&
          this.state.stuId === stu.studentUserId &&
          this.state.itemId === data.indicatorId
        }
        onVisibleChange={this.handleVisibleChange}
      >
        <div
          onClick={this.setStu.bind(this, stu.studentUserId, data.indicatorId)}
          className="globalWidth"
        >
          {data.icon ? (
            <span className="faker">
              <img src={data.icon} className="scoreImg" />
            </span>
          ) : data.color ? (
            <span style={{ backgroundColor: data.color }}>
              {data.levelName}
            </span>
          ) : data.levelName ? (
            <span>{data.levelName}</span>
          ) : (
            <span className="faker"></span>
          )}
        </div>
      </Popover>
    );
  };
  handleScoreVisible = (visible) => {
    this.setState({
      scoreVisible: visible,
    });
  };
  setScoreStu = (id) => {
    this.setState({
      stuId: id,
    });
  };
  domRender = (data) => {
    const { scoreStandard, termList } = this.props;
    const content =
      scoreStandard.length > 0 ? (
        <div>
          <Radio.Group
            onChange={this.scoreChange.bind(this, data.id, data.studentUserId)}
          >
            {scoreStandard.map((item) => (
              <div className="radioCheck scoreCheckBox">
                <Radio value={item.id}>
                  {item.icon ? (
                    <div className="inline">
                      <img src={item.icon} className="totalScoreImg" />
                      <span>{item.levelName}</span>
                    </div>
                  ) : item.color ? (
                    <div
                      style={{ backgroundColor: item.color }}
                      className="inline radius"
                    >
                      {item.levelName}
                    </div>
                  ) : (
                    <div className="inline radius">{item.levelName}</div>
                  )}
                </Radio>
              </div>
            ))}
          </Radio.Group>
        </div>
      ) : null;
    return scoreStandard.length > 0 ? (
      <Popover
        content={content}
        trigger="click"
        placement="bottomLeft"
        overlayStyle={{ width: 200, zIndex: 20 }}
        getPopupContainer={() => document.querySelectorAll(".home_body")[0]}
        visible={
          this.state.scoreVisible && this.state.stuId === data.studentUserId
        }
        onVisibleChange={this.handleScoreVisible}
      >
        <div
          onClick={this.setScoreStu.bind(
            this,
            data.studentUserId,
            data.indicatorId,
          )}
          className="globalWidth"
        >
          {data.criterionItemResponse && data.criterionItemResponse.icon ? (
            <span className="faker">
              <img src={data.criterionItemResponse.icon} className="scoreImg" />
            </span>
          ) : data.criterionItemResponse && data.criterionItemResponse.color ? (
            <span style={{ backgroundColor: data.criterionItemResponse.color }}>
              {data.criterionItemResponse.levelName}
            </span>
          ) : data.criterionItemResponse &&
            data.criterionItemResponse.levelName ? (
            <span>{data.criterionItemResponse.levelName}</span>
          ) : (
            <span className="faker"></span>
          )}
        </div>
      </Popover>
    ) : data.score ? (
      <input
        className="input"
        defaultValue={data.score}
        onChange={this.changeScore.bind(this, data.score)}
        onBlur={this.submitScore.bind(
          this,
          data.id,
          data.score,
          data.studentUserId,
        )}
        onFocus={this.onfocus}
      ></input>
    ) : (
      <input
        className="input"
        onChange={this.changeScore.bind(this, data.score)}
        onBlur={this.submitScore.bind(
          this,
          data.id,
          data.score,
          data.studentUserId,
        )}
        onFocus={this.onfocus}
      ></input>
    );
  };
  submitText = (id, text, stuId, e) => {
    e.stopPropagation();
    if (e.target.value === text) {
      return;
    }
    if (e.target.value === "" && !text) {
      return;
    }
    this.props.dispatch({
      type: "home/addResult",
      payload: {
        evaluationItemId: this.state.id,
        studentUserId: stuId,
        id: id,
        feedback: this.state.text,
      },
      onSuccess: () => {
        this.handleChange();
      },
    });
  };
  termCellRender = (columnIndex, rowIndex) => {
    const { termList, scoreStandard, termStandard } = this.props;
    const feedContent =
      termList.data.itemResultResponses.length > 0 ? (
        <div>
          <TextArea
            defaultValue={
              termList.data.itemResultResponses[rowIndex].feedback || ""
            }
            autosize={{ minRows: 2, maxRows: 3 }}
            onChange={this.textChange}
          />
          <Button
            type="primary"
            onClick={this.submitText.bind(
              this,
              termList.data.itemResultResponses[rowIndex].id,
            )}
          >
            {trans("global.sure", "确定")}
          </Button>
        </div>
      ) : null;
    const termContent = (
      <div>
        {termList.data.itemResultResponses.length > 0 &&
          termStandard.length &&
          columnIndex > 0 &&
          termList.data.itemResultResponses[0].itemIndicatorResultModelList &&
          termList.data.itemResultResponses[0].itemIndicatorResultModelList
            .length &&
          columnIndex <=
            termList.data.itemResultResponses[0].itemIndicatorResultModelList
              .length &&
          termStandard.map((item) =>
            item.id ===
            termList.data.itemResultResponses[rowIndex]
              .itemIndicatorResultModelList[columnIndex - 1].indicatorId ? (
              <div>
                {item.evaluationItemScaleModelResponse.scales.length > 0 &&
                item.evaluationItemScaleModelResponse.scales[0][0].items
                  .length > 0 ? (
                  <Radio.Group
                    onChange={this.termScoreChange.bind(
                      this,
                      item.id,
                      termList.data.itemResultResponses[rowIndex].id,
                    )}
                  >
                    {item.evaluationItemScaleModelResponse.scales[0][0].items.map(
                      (index) => (
                        <div className="radioCheck scoreCheckBox">
                          <Radio value={`${index.id}-${index.level}`}>
                            {
                              <div className="inline">
                                <div
                                  style={{ backgroundColor: index.color }}
                                  className="inline radius"
                                >
                                  <span>{index.level}</span>
                                </div>
                                <span className="inline">
                                  {index.description}
                                </span>
                              </div>
                            }
                          </Radio>
                        </div>
                      ),
                    )}
                  </Radio.Group>
                ) : null}
              </div>
            ) : null,
          )}
      </div>
    );
    const content =
      scoreStandard.length > 0 ? (
        <div>
          <Radio.Group
            onChange={this.scoreChange.bind(
              this,
              termList.data.itemResultResponses[rowIndex].id,
            )}
          >
            {scoreStandard.map((item) => (
              <div className="radioCheck scoreCheckBox">
                <Radio value={item.id}>
                  {item.icon ? (
                    <div className="inline">
                      <img src={item.icon} className="totalScoreImg" />
                      <span>{item.levelName}</span>
                    </div>
                  ) : item.color ? (
                    <div
                      style={{ backgroundColor: item.color }}
                      className="inline radius"
                    >
                      {item.levelName}
                    </div>
                  ) : (
                    <div className="inline radius">{item.levelName}</div>
                  )}
                </Radio>
              </div>
            ))}
          </Radio.Group>
        </div>
      ) : (
        <div className="scoreBox">
          <input className="scoreInput" onChange={this.changeScore} />
          <Button
            type="primary"
            onClick={this.submitScore.bind(
              this,
              termList.data.itemResultResponses[rowIndex].id,
            )}
          >
            {trans("global.sure", "确定")}
          </Button>
        </div>
      );
    const domRender = termList.data.itemResultResponses[rowIndex]
      .criterionItemResponse ? (
      <Popover
        content={content}
        trigger="click"
        placement="bottomLeft"
        overlayStyle={{ width: 200, zIndex: 20 }}
        getPopupContainer={() => document.querySelectorAll(".home_body")[0]}
      >
        {termList.data.itemResultResponses[rowIndex].criterionItemResponse &&
        termList.data.itemResultResponses[rowIndex].criterionItemResponse
          .icon ? (
          <span className="faker">
            <img
              src={
                termList.data.itemResultResponses[rowIndex]
                  .criterionItemResponse.icon
              }
              className="scoreImg"
            />
          </span>
        ) : termList.data.itemResultResponses[rowIndex].criterionItemResponse &&
          termList.data.itemResultResponses[rowIndex].criterionItemResponse
            .color ? (
          <span
            style={{
              backgroundColor:
                termList.data.itemResultResponses[rowIndex]
                  .criterionItemResponse.color,
            }}
          >
            {
              termList.data.itemResultResponses[rowIndex].criterionItemResponse
                .levelName
            }
          </span>
        ) : termList.data.itemResultResponses[rowIndex].criterionItemResponse &&
          termList.data.itemResultResponses[rowIndex].criterionItemResponse
            .levelName ? (
          <span>
            {
              termList.data.itemResultResponses[rowIndex].criterionItemResponse
                .levelName
            }
          </span>
        ) : (
          <span className="faker" />
        )}
      </Popover>
    ) : (
      <span className="gauge faker">
        <input
          className="input"
          defaultValue={termList.data.itemResultResponses[rowIndex].score || ""}
          onChange={this.changeScore.bind(
            this,
            termList.data.itemResultResponses[rowIndex].score,
          )}
          onBlur={this.submitScore.bind(
            this,
            termList.data.itemResultResponses[rowIndex].id,
            termList.data.itemResultResponses[rowIndex].score,
          )}
        />
      </span>
    );
    return termList.data.score ? (
      <div className="cellTable">
        {termList.data.itemResultResponses.length > 0 ? (
          columnIndex === 0 ? (
            domRender
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex <=
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length ? (
            <Popover
              content={termContent}
              trigger="click"
              placement="bottomLeft"
              overlayStyle={{ width: 200, zIndex: 20 }}
              getPopupContainer={() =>
                document.querySelectorAll(".home_body")[0]
              }
            >
              {termList.data.itemResultResponses[rowIndex]
                .itemIndicatorResultModelList[columnIndex - 1].icon ? (
                <span className="faker">
                  <img
                    src={
                      termList.data.itemResultResponses[rowIndex]
                        .itemIndicatorResultModelList[columnIndex - 1].icon
                    }
                    className="scoreImg"
                  />
                </span>
              ) : termList.data.itemResultResponses[rowIndex]
                  .itemIndicatorResultModelList[columnIndex - 1].color ? (
                <span
                  style={{
                    backgroundColor:
                      termList.data.itemResultResponses[rowIndex]
                        .itemIndicatorResultModelList[columnIndex - 1].color,
                  }}
                >
                  {
                    termList.data.itemResultResponses[rowIndex]
                      .itemIndicatorResultModelList[columnIndex - 1].levelName
                  }
                </span>
              ) : termList.data.itemResultResponses[rowIndex]
                  .itemIndicatorResultModelList[columnIndex - 1].levelName ? (
                <span>
                  {
                    termList.data.itemResultResponses[rowIndex]
                      .itemIndicatorResultModelList[columnIndex - 1].levelName
                  }
                </span>
              ) : (
                <span className="faker" />
              )}
            </Popover>
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                1 ? (
            <TextArea
              defaultValue={
                termList.data.itemResultResponses[rowIndex].feedback || ""
              }
              autosize={{ minRows: 2, maxRows: 3 }}
              onChange={this.textChange}
              onBlur={this.submitText.bind(
                this,
                termList.data.itemResultResponses[rowIndex].id,
                termList.data.itemResultResponses[rowIndex].feedback,
              )}
            />
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                2 ? (
            termList.data.itemResultResponses[rowIndex].evidence &&
            termList.data.itemResultResponses[rowIndex].evidence.length > 0 ? (
              termList.data.itemResultResponses[rowIndex].evidence[0]
                .explainFileModels &&
              termList.data.itemResultResponses[rowIndex].evidence[0]
                .explainFileModels.length > 0 ? (
                <div className="imgBox">
                  <img
                    src={
                      termList.data.itemResultResponses[rowIndex].evidence[0]
                        .explainFileModels[0].url
                    }
                  />
                </div>
              ) : null
            ) : (
              <Link
                to={`/studyPictures/${this.subjectId}/${this.year}/${this.state.id}/${termList.data.itemResultResponses[rowIndex].studentUserId}/${this.semesterId}`}
              >
                <span className="iconfont faker singleRow upload">
                  &#xe759;
                </span>
              </Link>
            )
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                3 ? (
            <span className="singleRow">
              {termList.data.itemResultResponses[rowIndex].status === 1
                ? trans("global.ready", "已发布")
                : trans("global.notSubmit", "待发布")}
            </span>
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                4 ? (
            termList.data.itemResultResponses[rowIndex].associatedTask ? (
              <span></span>
            ) : (
              <span
                onClick={this.delteStudent.bind(
                  this,
                  termList.data.itemResultResponses[rowIndex].studentUserId,
                )}
                className="delete singleRow"
              >
                {trans("global.delete", "删除")}
              </span>
            )
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                5 ? (
            termList.data.itemResultResponses[rowIndex].status === 1 ? (
              <span className="singleRow">
                {trans("global.submit", "发布")}
              </span>
            ) : (
              <span
                onClick={this.submitStudent.bind(
                  this,
                  termList.data.itemResultResponses[rowIndex].studentUserId,
                )}
                className="delete singleRow"
              >
                {trans("global.submit", "发布")}
              </span>
            )
          ) : (
            <span></span>
          )
        ) : null}
      </div>
    ) : (
      <div className="cellTable">
        {termList.data.itemResultResponses.length > 0 ? (
          columnIndex <
          termList.data.itemResultResponses[0].itemIndicatorResultModelList
            .length ? (
            <Popover
              content={termContent}
              trigger="click"
              placement="bottomLeft"
              overlayStyle={{ width: 200, zIndex: 20 }}
              getPopupContainer={() =>
                document.querySelectorAll(".home_body")[0]
              }
            >
              {termList.data.itemResultResponses[rowIndex]
                .itemIndicatorResultModelList[columnIndex].icon ? (
                <span className="faker">
                  <img
                    src={
                      termList.data.itemResultResponses[rowIndex]
                        .itemIndicatorResultModelList[columnIndex].icon
                    }
                    className="scoreImg"
                  />
                </span>
              ) : termList.data.itemResultResponses[rowIndex]
                  .itemIndicatorResultModelList[columnIndex].color ? (
                <span
                  style={{
                    backgroundColor:
                      termList.data.itemResultResponses[rowIndex]
                        .itemIndicatorResultModelList[columnIndex].color,
                  }}
                >
                  {
                    termList.data.itemResultResponses[rowIndex]
                      .itemIndicatorResultModelList[columnIndex].levelName
                  }
                </span>
              ) : termList.data.itemResultResponses[rowIndex]
                  .itemIndicatorResultModelList[columnIndex].levelName ? (
                <span>
                  {
                    termList.data.itemResultResponses[rowIndex]
                      .itemIndicatorResultModelList[columnIndex].levelName
                  }
                </span>
              ) : (
                <span className="faker" />
              )}
            </Popover>
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length ? (
            <TextArea
              defaultValue={
                termList.data.itemResultResponses[rowIndex].feedback || ""
              }
              autosize={{ minRows: 2, maxRows: 3 }}
              onChange={this.textChange}
              onBlur={this.submitText.bind(
                this,
                termList.data.itemResultResponses[rowIndex].id,
                termList.data.itemResultResponses[rowIndex].feedback,
              )}
            />
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                1 ? (
            termList.data.itemResultResponses[rowIndex].evidence &&
            termList.data.itemResultResponses[rowIndex].evidence &&
            termList.data.itemResultResponses[rowIndex].evidence.length > 0 ? (
              termList.data.itemResultResponses[rowIndex].evidence[0]
                .explainFileModels &&
              termList.data.itemResultResponses[rowIndex].evidence[0]
                .explainFileModels.length > 0 ? (
                termList.data.itemResultResponses[rowIndex].evidence[0]
                  .explainFileModels[0].type === "image" ? (
                  <div className="imgBox">
                    <img
                      src={
                        termList.data.itemResultResponses[rowIndex].evidence[0]
                          .explainFileModels[0].url
                      }
                    />
                  </div>
                ) : termList.data.itemResultResponses[rowIndex].evidence[0]
                    .explainFileModels[0].type === "video" ? (
                  <div className="videoBox imgBox">
                    <video
                      src={
                        termList.data.itemResultResponses[rowIndex].evidence[0]
                          .explainFileModels[0].url
                      }
                      controls="true"
                    ></video>
                  </div>
                ) : null
              ) : null
            ) : (
              <Link
                to={`/studyPictures/${this.subjectId}/${this.year}/${this.state.id}/${termList.data.itemResultResponses[rowIndex].studentUserId}/${this.semesterId}`}
              >
                <span className="iconfont faker singleRow upload">
                  &#xe759;
                </span>
              </Link>
            )
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                2 ? (
            <span className="singleRow">
              {termList.data.itemResultResponses[rowIndex].status === 2
                ? trans("global.notSubmit", "待发布")
                : trans("global.ready", "已发布")}
            </span>
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                3 ? (
            termList.data.itemResultResponses[rowIndex].associatedTask ? (
              <span></span>
            ) : (
              <span
                onClick={this.delteStudent.bind(
                  this,
                  termList.data.itemResultResponses[rowIndex].studentUserId,
                )}
                className="delete singleRow"
              >
                {trans("global.delete", "删除")}
              </span>
            )
          ) : termList.data.itemResultResponses[0]
              .itemIndicatorResultModelList &&
            columnIndex ===
              termList.data.itemResultResponses[0].itemIndicatorResultModelList
                .length +
                5 ? (
            termList.data.itemResultResponses[rowIndex].status === 2 ? (
              <span
                onClick={this.submitStudent.bind(
                  this,
                  termList.data.itemResultResponses[rowIndex].studentUserId,
                )}
                className="delete singleRow"
              >
                {trans("global.submit", "发布")}
              </span>
            ) : (
              <span className="singleRow">
                {trans("global.submit", "发布")}
              </span>
            )
          ) : (
            <span className="faker" />
          )
        ) : null}
      </div>
    );
  };
  cornerRender = () => {
    return (
      <div>
        {!this.props.termList.data.associatedTask && (
          <div className="addStudent" onClick={this.searchStudent}>
            <span className="iconfont addStu">&#xe759;</span>
            <span>{trans("global.addStu", "添加学生")}</span>
          </div>
        )}
      </div>
    );
  };
  openNav = (id, type) => {
    let payload = {};
    if (type === 9) {
      payload = {
        openKeys: id,
        selectedKeys: id,
        selectType: 1,
      };
      this.selectMenu(id, 1, id);
    } else {
      this.props.evaluationList.evaluationCategoryResponses.map((item) => {
        if (item.evaluationItemResponses.length > 0) {
          item.evaluationItemResponses.map((index) => {
            if (index.id === id) {
              payload = {
                openKeys: item.id,
                selectedKeys: id,
                selectType: 2,
              };
              this.selectMenu(id, 2, item.id);
            }
          });
        }
      });
    }

    this.props.dispatch({
      type: "home/saveKey",
      payload: {
        ...payload,
      },
    });
  };
  handleCellScroll = ({ scrollTop }) => {
    this.props.dispatch({
      type: "home/saveTop",
      payload: scrollTop,
    });
  };
  fullScreen = () => {
    if (this.state.visible) {
      parent.postMessage({ winFull: "open" }, "*");
    } else {
      parent.postMessage({ winFull: "close" }, "*");
    }
    this.setState(
      {
        visible: !this.state.visible,
        show: false,
      },
      () => {
        setTimeout(() => {
          this.setState({
            show: true,
          });
        }, 500);
      },
    );
  };
  cellScorll = (e) => {
    if (e.target.tagName !== "TEXTAREA") {
      const header = document.querySelector("#header");
      const left = document.querySelector("#left");
      left.scrollTop = e.target.scrollTop;
      header.scrollLeft = e.target.scrollLeft;
    }
  };
  leftScroll = (e) => {
    const cell = document.querySelector("#cell");
    cell.scrollTop = e.target.scrollTop;
  };
  headScroll = (e) => {
    const cell = document.querySelector("#cell");
    cell.scrollLeft = e.target.scrollLeft;
  };
  handleLeftScroll = (scrollTop) => {
    this.props.dispatch({
      type: "home/saveTop",
      payload: scrollTop,
    });
  };
  multiSelectOnSearch = (keyWord) => {
    if (this.timeId) {
      clearTimeout(this.timeId);
    }
    this.timeId = setTimeout(() => {
      this.getBaseAll(keyWord);
      this.timeId = false;
    }, 500);
  };
  closeMask = () => {
    this.setState({
      mask: false,
    });
  };
  multiSelectOnChange = (selectValue) => {
    this.setState({
      studentList: cloneObjectList(selectValue),
    });
  };
  getBaseAll(value = "") {
    this.props.dispatch({
      type: "studyPictures/allClassList",
      payload: {
        courseId: this.subjectId,
        semesterId: this.semesterId,
        name: value,
      },
    });
  }
  onChange = (pageNumber, pageSize) => {
    this.setState(
      {
        pageNumber,
      },
      () => {
        this.handleChange(true);
      },
    );
  };
  onShowSizeChange = (current, pageSize) => {
    this.setState(
      {
        pageSize: pageSize,
        pageNumber: 1,
      },
      () => {
        this.handleChange();
      },
    );
  };
  handleCancel = () => {
    this.setState({
      modalVisible: false,
    });
  };
  handleOk = () => {
    let studentList = [];
    this.state.studentList.map((item) => {
      studentList.push(item.studentUserId);
    });
    this.props.dispatch({
      type: "home/addStudent",
      payload: {
        evaluationItemId: this.state.id,
        courseId: this.subjectId,
        semesterId: this.semesterId,
        studentIds: studentList,
      },
      onSuccess: () => {
        this.handleChange(true);
        this.setState({
          studentList: [],
        });
      },
    });
    this.setState({
      modalVisible: false,
    });
  };
  semesterChange = (value) => {
    this.props.semesterList.map((item, index) => {
      if (JSON.stringify(item.id) === value.key) {
        this.props.dispatch({
          type: "home/setSemester",
          payload: index,
        });
        this.changeSemester(index);
      }
    });
  };
  selectMenu = (id, type, open, e) => {
    // this.props.dispatch({
    //   type: 'home/clearTable',
    //   payload: type,
    // })
    this.setState(
      {
        type,
        id,
        pageNumber: 1,
        openKey: open,
        selectKey: id,
        selectType: type,
      },
      () => {
        this.handleChange(true);
      },
    );
  };
  changeSemester = (year) => {
    this.semesterId = this.props.semesterList[year].id;
    this.props.dispatch({
      type: "home/getEvaluationList",
      payload: {
        courseId: this.subjectId,
        semesterId: this.semesterId,
      },
    });
    this.handleChange(true);
  };
  handleChange = (bool) => {
    if (bool) {
      this.props
        .dispatch({
          type: "home/clearTable",
          payload: this.state.type,
        })
        .then(() => {
          if (this.state.type === 2) {
            this.props
              .dispatch({
                type: "home/queryTermList",
                payload: {
                  evaluationItemId: this.state.id,
                  sortType: this.state.iptType,
                  groupIds: this.state.class,
                  postStatus: this.state.iptState,
                  semesterId: this.semesterId,
                  pageNo: this.state.pageNumber,
                  pageSize: this.state.pageSize,
                },
              })
              .then(() => {
                if (bool) {
                  this.setState(
                    {
                      show: false,
                    },
                    () => {
                      setTimeout(() => {
                        this.setState({
                          show: true,
                        });
                      }, 500);
                    },
                  );
                }
              });
          } else if (this.state.type === 1) {
            this.props.dispatch({
              type: "home/getStatisSource",
              payload: {
                //will do
              },
            });
            // this.props.dispatch({
            //   type: 'home/queryChart',
            //   payload: {
            //     courseId: this.subjectId,
            //     semesterId: this.semesterId,
            //     schoolYearId: this.year,
            //     categoryId: this.state.id,
            //     sortType: this.state.iptType,
            //     groupIds: this.state.class,
            //     pageNo: this.state.pageNumber,
            //     pageSize: this.state.pageSize,
            //   }
            // })
            this.props
              .dispatch({
                type: "home/queryAllScore",
                payload: {
                  courseId: this.subjectId,
                  semesterId: this.semesterId,
                  schoolYearId: this.year,
                  categoryId: this.state.id,
                  sortType: this.state.iptType,
                  groupIds: this.state.class,
                  pageNo: this.state.pageNumber,
                  pageSize: this.state.pageSize,
                },
              })
              .then(() => {
                this.setState(
                  {
                    show: false,
                  },
                  () => {
                    setTimeout(() => {
                      this.setState({
                        show: true,
                      });
                    }, 500);
                  },
                );
              });
          } else {
            this.props
              .dispatch({
                type: "home/updateAchievementList",
                payload: {
                  courseId: this.subjectId,
                  semesterId: this.semesterId,
                  sortType: this.state.iptType,
                  groupIds: this.state.class,
                  pageNo: this.state.pageNumber,
                  pageSize: this.state.pageSize,
                },
              })
              .then(() => {
                this.setState(
                  {
                    show: false,
                  },
                  () => {
                    setTimeout(() => {
                      this.setState({
                        show: true,
                      });
                    }, 500);
                  },
                );
              });
          }
        });
    } else {
      if (this.state.type === 2) {
        this.props
          .dispatch({
            type: "home/queryTermList",
            payload: {
              evaluationItemId: this.state.id,
              sortType: this.state.iptType,
              groupIds: this.state.class,
              postStatus: this.state.iptState,
              semesterId: this.semesterId,
              pageNo: this.state.pageNumber,
              pageSize: this.state.pageSize,
            },
          })
          .then(() => {
            if (bool) {
              this.setState(
                {
                  show: false,
                },
                () => {
                  setTimeout(() => {
                    this.setState({
                      show: true,
                    });
                  }, 500);
                },
              );
            }
          });
      } else if (this.state.type === 1) {
        this.props.dispatch({
          type: "home/getStatisSource",
          payload: {
            //will do
          },
        });
        // this.props.dispatch({
        //   type: 'home/queryChart',
        //   payload: {
        //     courseId: this.subjectId,
        //     semesterId: this.semesterId,
        //     schoolYearId: this.year,
        //     categoryId: this.state.id,
        //     sortType: this.state.iptType,
        //     groupIds: this.state.class,
        //     pageNo: this.state.pageNumber,
        //     pageSize: this.state.pageSize,
        //   }
        // })
        this.props
          .dispatch({
            type: "home/queryAllScore",
            payload: {
              courseId: this.subjectId,
              semesterId: this.semesterId,
              schoolYearId: this.year,
              categoryId: this.state.id,
              sortType: this.state.iptType,
              groupIds: this.state.class,
              pageNo: this.state.pageNumber,
              pageSize: this.state.pageSize,
            },
          })
          .then(() => {
            this.setState(
              {
                show: false,
              },
              () => {
                setTimeout(() => {
                  this.setState({
                    show: true,
                  });
                }, 500);
              },
            );
          });
      } else {
        this.props
          .dispatch({
            type: "home/updateAchievementList",
            payload: {
              courseId: this.subjectId,
              semesterId: this.semesterId,
              sortType: this.state.iptType,
              groupIds: this.state.class,
              pageNo: this.state.pageNumber,
              pageSize: this.state.pageSize,
            },
          })
          .then(() => {
            this.setState(
              {
                show: false,
              },
              () => {
                setTimeout(() => {
                  this.setState({
                    show: true,
                  });
                }, 100);
              },
            );
          });
      }
    }
  };
  checkSource = (value) => {
    this.props.dispatch({
      type: "home/check",
      payload: value,
    });
  };
  render() {
    const {
      evaluationList,
      allScore,
      baseAllStudents,
      termList,
      tableClass,
      achievementList,
      semester,
      semesterList,
      sourceData,
      source,
    } = this.props;
    const data = termList;
    const ifData = data.data;
    const windowPath = window.location.host.includes("daily")
      ? "https://task.daily.yungu-inc.org/#"
      : "https://task.yungu.org/#";
    const { studentList, show } = this.state;
    const url = this.state.url;
    const origin = window.location.origin.includes("daily")
      ? "https://assessment.daily.yungu-inc.org/index#/assessment"
      : "https://report.yungu.org/index#/assessment";
    const linkUrl =
      sourceData && sourceData.name
        ? `${origin}/newCourse/${sourceData.id}/${this.subjectId}/${this.semesterId}`
        : "";
    const menu = semesterList.length && (
      <Menu onClick={this.semesterChange}>
        {semesterList.length &&
          semesterList.map((item) => (
            <Menu.Item key={item.id}>
              <span>{item.name}</span>
            </Menu.Item>
          ))}
      </Menu>
    );
    const groupMenu = tableClass.length && (
      <Menu onClick={this.groupChange}>
        {tableClass.length &&
          tableClass.map((item) => (
            <Menu.Item key={item.id}>
              <span>{item.name}</span>
            </Menu.Item>
          ))}
      </Menu>
    );

    return (
      <Fragment>
        <div className="selectDiv">
          {semesterList.length > 0 ? (
            <Dropdown
              overlay={menu}
              trigger={["click"]}
              getPopupContainer={() =>
                document.querySelectorAll(".selectDiv")[0]
              }
            >
              <div style={{ cursor: "pointer" }}>
                <span>{semesterList[semester].name}</span>
                <Icon type="caret-down" />
              </div>
            </Dropdown>
          ) : null}
          {tableClass.length > 0 ? (
            <Dropdown
              overlay={groupMenu}
              trigger={["click"]}
              getPopupContainer={() =>
                document.querySelectorAll(".selectDiv")[0]
              }
            >
              <div style={{ cursor: "pointer", marginLeft: "20px" }}>
                <span>{this.state.groupName}</span>
                <Icon type="caret-down" />
              </div>
            </Dropdown>
          ) : null}
          {/*{
            semesterList.length &&
            <Select value={semesterList[semester].id} style={{ width: 170, marginRight: 10 }} onChange={this.semesterChange}>
            {
              semesterList.length && semesterList.map(item => (
                <Option value={item.id} key={item.id}>{item.name}</Option>
              ))
            }
          </Select>
          }*/}
          {/*<Select defaultValue={this.state.defaultClass} style={{ width: 170 }} onChange={this.groupChange}>
          {
            tableClass.length && tableClass.map(item => (
              <Option value={item.id} key={item.id}>{item.name}</Option>
            ))
          }
        </Select>*/}
        </div>
        <div
          style={{
            padding: "15px 10px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #f2f2f5",
            fontSize: "16px",
          }}
        >
          <div
            className={
              source === 1 ? "check inline margin" : "noCheck inline margin"
            }
            onClick={this.checkSource.bind(this, 1)}
          >
            {trans("eva.evaSource", "课程评价")}
          </div>
          {sourceData && sourceData.name ? (
            <div
              className={
                source === 2 ? "check inline margin" : "noCheck inline margin"
              }
              onClick={this.checkSource.bind(this, 2)}
            >
              {sourceData.name}
            </div>
          ) : null}
        </div>
        {source === 1 ? (
          <div className="home">
            {this.state.visible ? (
              <AssentmentList
                evaluationList={evaluationList}
                selectMenu={this.selectMenu}
                dispatch={this.props.dispatch}
                semesterList={this.props.semesterList}
                changeSemester={this.changeSemester}
                subject={this.subjectId}
                id={this.state.id}
                clickOk={this.state.clickOk}
                semesterId={this.semesterId}
              />
            ) : null}
            <div className="main">
              <ScreenInput
                type={this.state.type}
                fullScreen={this.fullScreen}
                queryTermList={this.queryTermList}
                tableClass={tableClass}
                dispatch={this.props.dispatch}
                id={this.state.id}
                courseId={this.subjectId}
                semesterId={
                  this.props.semesterList.length &&
                  this.props.semesterList[semester].id
                }
                openKeys={this.props.openKeys}
                evaluationList={evaluationList}
                termList={this.props.termList}
                schoolYearId={this.year}
                handleChange={this.handleChange}
                exportEva={this.exportEva}
                evaluationItemId={this.state.id}
                sortType={this.state.iptType}
                groupIds={this.state.class}
                changeType={this.changeType}
                postStatus={this.state.iptState}
              />
              <Modal
                title=""
                visible={this.state.modalVisible}
                okText=""
                cancelText=""
                closable={false}
                footer={null}
                getContainer={() => document.querySelectorAll(".main")[0]}
              >
                <MultiSelect
                  className="multiSelect"
                  isMobile={false}
                  onSearch={this.multiSelectOnSearch}
                  onChange={this.multiSelectOnChange}
                  sourceData={baseAllStudents}
                  initData={studentList}
                  onOk={this.handleOk}
                  onCancel={this.handleCancel}
                  handleOk={this.handleOk}
                  handleCancel={this.handleCancel}
                />
              </Modal>
              {this.state.type === 1 &&
              allScore &&
              allScore.data &&
              allScore.data.studentList ? (
                <DimensionTable
                  id={this.state.id}
                  allScore={allScore}
                  dispatch={this.props.dispatch}
                  handleChange={this.handleChange}
                  openNav={this.openNav}
                  statisticalSource={this.props.statisticalSource}
                  //chart={this.props.chart}
                  onFocus={this.onfocus}
                />
              ) : this.state.type === 2 &&
                termList &&
                termList.data &&
                termList.data.itemIndicatorRubricsResponses ? (
                <div className="mainTable">
                  <div className="home_header">
                    <div className="inline home_cornor">
                      {data.data && !data.data.associatedTask && (
                        <div
                          className="addStudent"
                          onClick={this.searchStudent}
                        >
                          <span className="iconfont">&#xe759;</span>
                          <span>{trans("global.addStu", "添加学生")}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className="inline header"
                      id="header"
                      onScroll={this.headScroll}
                    >
                      {data.data && data.data.score ? (
                        <div className="headerBox align">
                          {trans("establish.score", "成绩")}
                        </div>
                      ) : null}
                      {ifData.itemIndicatorRubricsResponses &&
                      ifData.itemIndicatorRubricsResponses.length > 0
                        ? ifData.itemIndicatorRubricsResponses.map((item) =>
                            item.evaluationItemScaleModelResponse &&
                            item.evaluationItemScaleModelResponse &&
                            item.evaluationItemScaleModelResponse.scales &&
                            item.evaluationItemScaleModelResponse.scales
                              .length > 0 ? (
                              <div className="headerBox align">
                                <Tooltip
                                  title={
                                    item.evaluationItemScaleModelResponse
                                      .scales[0][0].indicator
                                  }
                                >
                                  <span className="title">
                                    {
                                      item.evaluationItemScaleModelResponse
                                        .scales[0][0].indicator
                                    }
                                  </span>
                                </Tooltip>
                              </div>
                            ) : null,
                          )
                        : null}
                      <div className="headerBox align globalFeedback">
                        {trans("global.feedback", "反馈")}
                      </div>
                      <div className="headerBox align specialWidth">
                        {trans("global.study", "学习证据")}
                      </div>
                      <div className="headerBox align">
                        {trans("global.status", "状态")}
                      </div>
                      <div className="headerBox specialWidth"></div>
                    </div>
                  </div>
                  <div
                    className="home_body"
                    style={{ height: "calc(100% - 48px)" }}
                  >
                    <div
                      className="inline home_left"
                      id="left"
                      onScroll={this.leftScroll}
                    >
                      <div className="leftList">
                        {data.data.itemResultResponses &&
                        data.data.itemResultResponses.length > 0
                          ? data.data.itemResultResponses.map((item) => (
                              <div className="userName">
                                <div className="float">
                                  <img src={item.headPortrait} />
                                </div>
                                <div>
                                  <span className="name">
                                    {item.studentName}
                                  </span>
                                  <span className="enName">
                                    {item.studentEName}
                                  </span>
                                  <div className="userNumber">
                                    {item.studentNo}
                                  </div>
                                </div>
                              </div>
                            ))
                          : null}
                      </div>
                    </div>
                    <div
                      className="inline home_cell"
                      id="cell"
                      onScroll={this.cellScorll}
                    >
                      {data.data.itemResultResponses &&
                      data.data.itemResultResponses.length > 0
                        ? data.data.itemResultResponses.map((item) => (
                            <div className="cellRow">
                              {ifData && ifData.score ? (
                                <div className="inline globalWidth">
                                  {this.domRender(item)}
                                </div>
                              ) : null}
                              {item.itemIndicatorResultModelList &&
                              item.itemIndicatorResultModelList.length > 0
                                ? item.itemIndicatorResultModelList.map(
                                    (index) => (
                                      <div className="inline globalWidth">
                                        {this.domEvaRender(index, item)}
                                      </div>
                                    ),
                                  )
                                : null}
                              {
                                <div className="inline globalWidth globalFeedback textLeft">
                                  <div className="cellTable">
                                    <Tooltip title={item.feedback}>
                                      <TextArea
                                        defaultValue={item.feedback}
                                        autosize={{ minRows: 2, maxRows: 3 }}
                                        onChange={this.textChange}
                                        onBlur={this.submitText.bind(
                                          this,
                                          item.id,
                                          item.feedback,
                                          item.studentUserId,
                                        )}
                                        onFocus={this.onfocus}
                                      />
                                    </Tooltip>
                                  </div>
                                </div>
                              }
                              {
                                <div className="inline globalWidth specialWidth">
                                  {item.evidence.length > 0 &&
                                  item.evidence[0].explainFileModels &&
                                  item.evidence[0].explainFileModels.length >
                                    0 ? (
                                    <div className="imgBox">
                                      {item.taskId ? (
                                        <div
                                          onClick={this.showModal.bind(
                                            this,
                                            `${windowPath}/cardDetail/true/1/${item.studentUserId}/${item.taskId}`,
                                          )}
                                        >
                                          <img
                                            src={
                                              item.evidence[0]
                                                .explainFileModels[0]
                                                .previewImage
                                            }
                                          />
                                          <span className="spanOpa">
                                            <i className="iconfont">&#xe625;</i>
                                            {
                                              item.evidence[0].explainFileModels
                                                .length
                                            }
                                          </span>
                                        </div>
                                      ) : item.evidenceId ? (
                                        <Link
                                          to={`/studyPictures/${this.subjectId}/${this.year}/${this.state.id}/${item.studentUserId}/${this.semesterId}/${item.evidenceId}`}
                                        >
                                          <img
                                            src={
                                              item.evidence[0]
                                                .explainFileModels[0]
                                                .previewImage
                                            }
                                          />
                                          <span className="spanOpa">
                                            <i className="iconfont">&#xe625;</i>
                                            {
                                              item.evidence[0].explainFileModels
                                                .length
                                            }
                                          </span>
                                        </Link>
                                      ) : (
                                        <img
                                          src={
                                            item.evidence[0]
                                              .explainFileModels[0].previewImage
                                          }
                                        />
                                      )}
                                    </div>
                                  ) : termList.data
                                      .associatedTask ? null : item.evidenceId ? (
                                    <Link
                                      to={`/studyPictures/${this.subjectId}/${this.year}/${this.state.id}/${item.studentUserId}/${this.semesterId}/${item.evidenceId}`}
                                    >
                                      <span className="iconfont faker singleRow upload">
                                        &#xe759;
                                      </span>
                                    </Link>
                                  ) : (
                                    <Link
                                      to={`/studyPictures/${this.subjectId}/${this.year}/${this.state.id}/${item.studentUserId}/${this.semesterId}`}
                                    >
                                      <span className="iconfont faker singleRow upload">
                                        &#xe759;
                                      </span>
                                    </Link>
                                  )}
                                </div>
                              }
                              <div className="inline globalWidth">
                                <span className="faker textLeft">
                                  {item.status === 1
                                    ? trans("global.ready", "已发布")
                                    : item.status === 3
                                      ? trans(
                                          "global.notSubmit2",
                                          "待发布-修改",
                                        )
                                      : trans("global.notSubmit", "待发布")}
                                </span>
                              </div>
                              <div className="inline globalWidth specialWidth">
                                {item.status === 1 ? (
                                  <span className="inline iconfont tableIcon">
                                    &#xe684;
                                  </span>
                                ) : (
                                  <span
                                    onClick={this.submitStudent.bind(
                                      this,
                                      item.studentUserId,
                                    )}
                                    className="delete inline iconfont tableIcon"
                                  >
                                    &#xe684;
                                  </span>
                                )}
                                {termList.data.associatedTask ? (
                                  <span className="inline iconfont tableIcon">
                                    &#xe739;
                                  </span>
                                ) : (
                                  <span
                                    onClick={this.delteStudent.bind(
                                      this,
                                      item.studentUserId,
                                    )}
                                    className="delete inline iconfont tableIcon"
                                  >
                                    &#xe739;
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        : null}
                    </div>
                  </div>
                </div>
              ) : this.state.type === 9 &&
                achievementList.userAchievementLists &&
                achievementList.userAchievementLists.length > 0 ? (
                <AchievementTable
                  id={this.state.id}
                  dispatch={this.props.dispatch}
                  achievementList={achievementList}
                  handleChange={this.handleChange}
                  openNav={this.openNav}
                  evaluationList={evaluationList}
                  onFocus={this.onfocus}
                />
              ) : evaluationList && evaluationList.length > 0 ? (
                <div className={"styleNull"}>
                  <div>
                    <div className={"styleColor"}>
                      {trans("global.Tips", "当前学期还没有评价方案哦！")}
                    </div>
                    <Link
                      to={`/EvaluationProgramme/${this.subjectId}/${
                        (semesterList.length && semesterList[semester].id) ||
                        null
                      }/${
                        evaluationList && evaluationList.id
                          ? evaluationList.id
                          : null
                      }`}
                    >
                      <div className="addPlan">
                        <Button>
                          {trans("global.settingTotal", "设置评价方案")}
                        </Button>
                      </div>
                    </Link>
                  </div>
                </div>
              ) : null}
              {url === "" ? null : (
                <Modal
                  title=""
                  visible={this.state.frameVisible}
                  className="iframeModal"
                  closable={false}
                  onOk={this.handleOk}
                  onCancel={this.handleCancel}
                  footer={null}
                >
                  <iframe src={url}></iframe>
                </Modal>
              )}
              <Pagination
                showQuickJumper
                showSizeChanger
                defaultPageSize={20}
                onShowSizeChange={this.onShowSizeChange}
                current={this.state.pageNumber}
                total={this.props.total || 0}
                onChange={this.onChange}
                //hideOnSinglePage
              />
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", height: "100vh" }} className="linkFrame">
            {sourceData && sourceData.id ? (
              <iframe src={linkUrl}></iframe>
            ) : null}
          </div>
        )}
        {this.state.mask ? (
          <div className="mask" onClick={this.closeMask}></div>
        ) : null}
      </Fragment>
    );
  }
}

export default connect(({ home, studyPictures }) => ({
  allScore: home.allScore,
  evaluationList: home.evaluationList,
  baseAllData: home.baseAllData,
  subject: studyPictures.subject,
  baseAllStudents: studyPictures.baseAllStudents,
  termList: home.termList,
  tableClass: home.tableClass,
  scoreStandard: home.scoreStandard,
  termStandard: home.termStandard,
  achievementList: home.achievementList,
  selectedKeys: home.selectedKeys,
  openKeys: home.openKeys,
  typeObj: home.typeObj,
  semester: home.semester,
  total: home.total,
  semesterList: home.semesterList,
  chart: home.chart,
  source: home.source,
  sourceData: home.sourceData,
  group: home.group,
  statisticalSource: home.statisticalSource,
  updateAchievementSource: home.updateAchievementSource,
}))(Home);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};
