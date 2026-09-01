import React from "react";
import {
  Checkbox,
  Modal,
  Pagination,
  Select,
  Spin,
  Table,
  Tooltip,
} from "antd";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import StuConditionSelect from "../../components/StuConditionSelect";
import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const { Option } = Select;

class WrongTable extends React.Component {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/wrongTable/:id/:status?").exec(this.url);
    this.id = JSON.parse(this.pathMatch[1]);
    this.status = this.pathMatch[2]
      ? Number.parseInt(this.pathMatch[2], 10)
      : null;
    this.state = {
      isSelect: true,
      gradeIdList: [],
      indeterminate: true,
      checkAllGardes: false,
      indeterminate1: false,
      typeList: [],
      checkAllType: false,
      testId: [],
      pageNoErr: 1,
      pageSizeErr: 40,
      errDetialList: [],
      hoverIndexID: null,
      subjectId: "",
      searchStuId: undefined, //搜索学生id
      searchList: [],
      initAllStu: [], // 全部学生列表，初始化时使用
      studentId: "",
      groupId: "",
      loading: false,
      gradeId: "",
      studentList: [], //学生列表
      isPushStatus: false,
      isQueryCriteria: false,
      saveStuRecord: {},
      isKnowledgeGrouping: 1,
    };
    this.stuId = "";
  }

  componentDidMount() {
    this.props
      .dispatch({
        type: "studentLearning/getAllSubject",
      })
      .then(() => {
        if (this.status == 0) {
          const { value, groupId } = this.state;
          this.setState({
            loading: true,
          });
          let payloadObject = {
            studentName: value,
            studentGroupIds: this.getGroupIds(),
            typeSource: "0",
            type: 1,
            source: 1,
          };
          if (this.stuId) {
            payloadObject.studentId = Number(this.stuId);
          } else if (this.state.searchStuId) {
            payloadObject.studentId = Number(this.state.searchStuId);
          }
          this.props
            .dispatch({
              type: "global/postFindUserCaptureCount",
              payload: {
                // ...payloadObj,
                groupIdList: this.getGroupIds().join(","),
              },
            })
            .then(() => {
              const { userList } = this.props;
              this.setState(
                {
                  studentList: userList,
                  loading: false,
                  studentId: userList?.length > 0 ? userList[0].userId : "",
                  searchList: userList,
                  initAllStu: userList,
                },
                () => {
                  this.getType();
                  this.getGrade();
                  this.getExamName();
                  this.getPage();
                },
              );
            });
        }
        if (this.props.allSubjectList && this.props.allSubjectList.length > 0) {
          if (this.status == 0) {
            this.getStudentGroupList();
          } else if (this.status == 1) {
            this.props
              .dispatch({
                type: "global/getPushedStudentList",
                payload: {
                  id: this.id,
                },
              })
              .then(() => {
                this.setState({
                  studentList: this.props.pushedStudentList,
                });
              });
          }
          if (this.status != 0) {
            this.getType();
            this.getGrade();
          }
          if (this.id) {
            this.props
              .dispatch({
                type: "global/getWrongQuestionVersionDetail",
                payload: {
                  id: this.id,
                },
              })
              .then(() => {
                const { wrongQuestionVersionDetail } = this.props;
                let newExamIdList = [];
                wrongQuestionVersionDetail?.examIdList &&
                  wrongQuestionVersionDetail?.examIdList.length > 0 &&
                  wrongQuestionVersionDetail.examIdList.map((item) => {
                    newExamIdList.push(item + "");
                  });
                this.setState(
                  {
                    subjectId: wrongQuestionVersionDetail.subjectId,
                    gradeIdList: wrongQuestionVersionDetail.gradeIdList,
                    typeList: wrongQuestionVersionDetail.examTypeList,
                    testId: newExamIdList,
                    saveStuRecord: wrongQuestionVersionDetail,
                  },
                  () => {
                    if (this.status != 0) {
                      this.getExamName();
                      this.getPage();
                    }
                  },
                );
              });
          }
        }
      });
  }
  getExamName = () => {
    const { gradeIdList, typeList, pageNoErr, subjectId } = this.state;
    this.props.dispatch({
      type: "global/getNameList",
      payload: {
        studentId: this.state.studentId,
        subjectId: subjectId == 0 ? "" : subjectId,
        gradeIdList:
          gradeIdList.length == this.props.stuGradeList.length
            ? ""
            : gradeIdList.join(","),
        paperTypeList:
          typeList.length == this.props.stuTypeList.length
            ? ""
            : typeList.join(","),
      },
    });
  };
  getGrade = () => {
    this.props.dispatch({
      type: "global/getGradeList",
      payload: {
        studentId: this.state.studentId,
      },
    });
  };
  getType = () => {
    this.props.dispatch({
      type: "global/getTypeList",
    });
  };
  back = () => {
    window.close() || this.props.history.goBack();
    // window.close(`${window.location.origin}/#/examAnalysis`);
  };
  getPage = () => {
    // this.props
    //   .dispatch({
    //     type: "home/clearPartScore",
    //     payload: {},
    //   })
    //   .then(() => {
    const { gradeIdList, typeList, testId, pageSizeErr, pageNoErr, subjectId } =
      this.state;
    this.props
      .dispatch({
        type: "global/getErrorQuestionList",
        payload: {
          studentId: this.state.studentId,
          subjectId: subjectId == 0 ? "" : subjectId,
          gradeIdList:
            gradeIdList.length == this.props.stuGradeList.length
              ? ""
              : gradeIdList.join(","),
          examTypeList:
            typeList.length == this.props.stuTypeList.length
              ? ""
              : typeList.join(","),
          examIdList: testId[0] == 0 ? "" : testId.join(","),
          pageNum: pageNoErr,
          pageSize: pageSizeErr,
        },
      })
      .then(() => {
        const { errorQuestionList } = this.props;
        this.setState({
          errDetialList: errorQuestionList?.errorQuestionDetialList || [],
        });
      });
    // });
  };
  clickRetract = () => {
    this.setState({
      isSelect: !this.state.isSelect,
    });
  };
  allGardeChange = (e, newGradeList) => {
    let gradeList = JSON.parse(JSON.stringify(newGradeList));
    let array = [];
    if (e.target.checked) {
      gradeList?.length > 0 &&
        gradeList.map((item) => {
          array.push(item.value);
        });
    }
    this.setState(
      {
        gradeIdList: e.target.checked ? array : [],
        indeterminate: false,
        checkAllGardes: e.target.checked,
      },
      () => {
        // console.log(arr, e.target.checked, "zhang1");
        this.getExamName();
        this.getPage();
      },
    );
  };
  getGroupList = () => {
    const { gradeId } = this.state;
    const { studentGroupList } = this.props;
    let array = [];
    if (gradeId > 0) {
      for (const element of studentGroupList) {
        if (gradeId == element.gradeId) {
          array = element.studentClassModels;
          break;
        }
      }
    }
    return array;
  };
  allTypeChange = (e, newGradeList) => {
    let gradeList = JSON.parse(JSON.stringify(newGradeList));
    let array = [];
    if (e.target.checked) {
      gradeList?.length > 0 &&
        gradeList.map((item) => {
          array.push(item.value);
        });
    }
    this.setState(
      {
        typeList: e.target.checked ? array : [],
        indeterminate1: false,
        checkAllType: e.target.checked,
      },
      () => {
        // console.log(arr, e.target.checked, "zhang1");
        this.getExamName();
        this.getPage();
      },
    );
  };
  changeType = (id, plainOptions) => {
    this.setState(
      {
        typeList: id,
        indeterminate1: id.length > 0 && id.length < plainOptions.length,
        checkAllGardes: id.length === plainOptions.length,
      },
      () => {
        this.getExamName();
        this.getPage();
      },
    );
  };
  changeTest = (id, plainOptions) => {
    let testList = [];
    if (id.includes("0")) {
      testList = ["0"];
    } else {
      testList = id.length == plainOptions.length ? ["0"] : id;
    }
    this.setState(
      {
        testId: testList,
      },
      () => {
        this.getPage();
      },
    );
  };
  changeGrade = (id, plainOptions) => {
    this.setState(
      {
        gradeIdList: id,
        indeterminate: id.length > 0 && id.length < plainOptions.length,
        checkAllGardes: id.length === plainOptions.length,
      },
      () => {
        console.log(this.state.gradeIdList, "zhang2");
        this.getExamName();
        this.getPage();
      },
    );
  };
  onRow = (row, index) => {
    return {
      onClick: (event) => {
        console.log(row, index, "www");
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
  changeNoErr = (value) => {
    this.setState(
      {
        pageNoErr: value,
      },
      () => {
        this.getPage();
      },
    );
  };
  onShowSizeErrChange = (current, pageSize) => {
    this.setState(
      {
        pageNoErr: 1,
        pageSizeErr: pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };
  clickBtnOpt = (index, id, e) => {
    e.stopPropagation();
    let state = Object.assign({}, this.state);
    state[`feedbackOpt${id}`] = index;
    this.setState(
      {
        ...state,
      },
      () => {
        this.props.dispatch({
          type: "global/getChangewrongquestionCorrectness",
          payload: {
            questionId: id,
            studentFeedback: index,
          },
        });
        // console.log(this.state, "ccc");
      },
    );
  };
  getStudentGroupList = () => {
    this.props
      .dispatch({
        type: "global/getStudentGroupList",
        payload: {},
      })
      .then(() => {
        this.setState({
          gradeId: this.setGradeId(),
        });
      });
  };
  setGradeId = () => {
    const { studentGroupList } = this.props;
    let gradeId = "";
    if (studentGroupList && studentGroupList.length == 1) {
      gradeId = studentGroupList[0].gradeId;
    }
    return gradeId;
  };
  //搜索学生
  handleSearch = (value) => {
    // this.getStudents(value);
    // const { initAllStu } = this.state;
    // let filterList = initAllStu.filter(
    //   (item) => item.userName.indexOf(value) > -1
    // );
    // this.setState({
    //   searchList: filterList,
    // });
    this.props
      .dispatch({
        type: "global/getPushedStudentList",
        payload: {
          id: this.id,
          keyWord: value,
        },
      })
      .then(() => {
        this.setState({
          // studentId: userList?.length > 0 ? userList[0].userId : "",
          searchList: this.props.pushedStudentList,
        });
      });
  };
  changeStu = (value) => {
    let newStuList = [];
    this.state.initAllStu.length > 0 &&
      this.state.initAllStu.map((item) => {
        if (value == item.userId) {
          newStuList.push(item);
        }
      });
    this.setState(
      {
        studentId: value,
        searchStuId: value,
        gradeId: "",
        groupId: "",
        searchList: this.state.initAllStu,
        studentList: newStuList,
      },
      () => {
        // this.saveCondition();
        // this.getAllStudent();
        this.getGrade();
        this.getExamName();
        this.getPage();
      },
    );
  };
  getGroupIds = () => {
    const { studentGroupList } = this.props;
    const { gradeId, groupId } = this.state;
    let groupIds = [];
    if (gradeId == "") {
      groupIds = [];
    } else if (groupId === "") {
      let groupList = this.getGroupList();
      let ids = [];
      groupList &&
        groupList.length > 0 &&
        groupList.map((item) => {
          ids.push(item.studentGroupId);
        });
      groupIds = ids;
    } else {
      groupIds = [groupId];
    }
    return groupIds;
  };
  getAllStudent = (type) => {
    const { value, groupId } = this.state;
    this.setState({
      loading: true,
    });
    let payloadObject = {
      studentName: value,
      studentGroupIds: this.getGroupIds(),
      typeSource: "0",
      type: 1,
      source: 1,
    };
    if (this.stuId) {
      payloadObject.studentId = Number(this.stuId);
    } else if (this.state.searchStuId) {
      payloadObject.studentId = Number(this.state.searchStuId);
    }
    this.props
      .dispatch({
        type: "global/postFindUserCaptureCount",
        payload: {
          // ...payloadObj,
          groupIdList: this.getGroupIds().join(","),
        },
      })
      .then(() => {
        const { userList } = this.props;
        if (type) {
          this.setState(
            {
              studentList: userList,
              loading: false,
              studentId: userList?.length > 0 ? userList[0].userId : "",
              searchList: userList,
              initAllStu: userList,
            },
            () => {
              this.getGrade();
              this.getExamName();
              this.getPage();
            },
          );
        } else {
          this.setState(
            {
              studentList: userList,
              loading: false,
              studentId: userList?.length > 0 ? userList[0].userId : "",
            },
            () => {
              this.getGrade();
              this.getExamName();
              this.getPage();
            },
          );
        }
      });
  };
  changeCondition = (value, type) => {
    switch (type) {
      case "grade": {
        this.setState(
          {
            gradeId: value,
            groupId: "",
            // studentId: "",
            searchStuId: undefined,
          },
          () => {
            this.getList();
          },
        );
        break;
      }
      case "group": {
        this.setState(
          {
            groupId: value,
            // studentId: "",
            searchStuId: undefined,
          },
          () => {
            this.getList();
          },
        );
      }
    }
  };
  getList = () => {
    // this.saveCondition();
    this.getAllStudent();
  };
  changeStudentId = (studentId) => {
    if (studentId) {
      this.setState(
        {
          studentId,
        },
        () => {
          // this.saveCondition();
          // this.getType();
          this.getGrade();
          this.getExamName();
          this.getPage();
        },
      );
    } else {
      this.setState(
        {
          studentId,
          searchStuId: undefined,
          gradeId: this.setGradeId(),
          groupId: "",
        },
        () => {
          // this.saveCondition();
          this.getAllStudent(true);
          // this.getType();
          // this.getGrade();
          // this.getExamName();
          // this.getPage();
        },
      );
    }
  };
  checkError = (e, defaultImg) => {
    e.target.src = defaultImg;
  };
  clickCriteriaBtn = (record) => {
    this.setState({
      isQueryCriteria: true,
      // saveStuRecord: record,
    });
  };
  handleCriteriaBtn = () => {
    this.setState({
      isQueryCriteria: false,
      // saveStuRecord: null,
    });
  };
  onRef1 = (reference) => {
    this.stuConditionSelect = reference;
  };
  pushStatus = () => {
    this.setState({
      isPushStatus: true,
    });
  };
  render() {
    const {
      stuGradeList,
      stuTypeList,
      stuNameList,
      errorQuestionList,
      allSubjectList,
      studentGroupList,
      wrongQuestionVersionDetail,
    } = this.props;
    const {
      isSelect,
      checkAllGardes,
      gradeIdList,
      checkAllType,
      typeList,
      testId,
      errDetialList,
      subjectId,
      searchStuId,
      searchList,
      gradeId,
      groupId,
      loading,
      studentList,
      studentId,
      isPushStatus,
      isQueryCriteria,
      isKnowledgeGrouping,
      saveStuRecord,
    } = this.state;
    let newGradeList = [];
    let groupList = this.getGroupList();
    stuGradeList &&
      stuGradeList.length &&
      stuGradeList.map((item) => {
        newGradeList.push({
          label: language ? item.gradeName : item.gradeEnName,
          value: item.gradeId,
        });
      });
    let newTypeList = [];
    stuTypeList &&
      stuTypeList.length &&
      stuTypeList.map((item) => {
        newTypeList.push({
          label: item.typeName,
          value: item.code,
        });
      });
    const newcolumns = [
      {
        title: trans("global.wrongCollection", "错题集合"),
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
                        <i className={styles.iconfont}>&#xe798;</i>
                        {record.examName}
                      </span>
                      {record.type === 1 ? (
                        <span
                          className={[
                            styles.questionType1,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.radio", "单选题")}
                        </span>
                      ) : record.type === 2 ? (
                        <span
                          className={[
                            styles.questionType2,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={styles.iconfont}>&#xe755;</i>
                          {trans("global.check", "多选题")}
                        </span>
                      ) : record.type === 3 ? (
                        <span
                          className={[
                            styles.questionType3,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={styles.iconfont}>&#xe802;</i>
                          {trans("global.pack", "填空题")}
                        </span>
                      ) : record.type === 4 ? (
                        <span
                          className={[
                            styles.questionType4,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={styles.iconfont}>&#xe800;</i>
                          {trans("global.judge", "判断题")}
                        </span>
                      ) : (
                        <span
                          className={[
                            styles.questionType5,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i
                            className={styles.iconfont}
                            style={{ fontSize: 12 }}
                          >
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
                    <div className={styles.operateRow}>
                      <span className={styles.addRow}>
                        <span>
                          {trans("global.practiceFeedback", "练习反馈")}：
                        </span>
                        <span
                          className={[
                            styles.btnOpt,
                            this.state[`feedbackOpt${record.questionId}`] ==
                              2 || record.studentFeedback == 2
                              ? styles.blurOpt
                              : "",
                          ].join(" ")}
                          onClick={(e) =>
                            this.clickBtnOpt(2, record.questionId, e)
                          }
                        >
                          <i className={styles.iconfont}>&#xe893;</i>
                          {trans("global.wrong", "错误")}
                        </span>
                        <span
                          className={[
                            styles.btnOpt,
                            this.state[`feedbackOpt${record.questionId}`] ==
                              3 || record.studentFeedback == 3
                              ? styles.blurOpt
                              : "",
                          ].join(" ")}
                          onClick={(e) =>
                            this.clickBtnOpt(3, record.questionId, e)
                          }
                        >
                          <i className={styles.iconfont}>&#xe894;</i>
                          {trans("global.partiallyCorrect", "部分正确")}
                        </span>
                        <span
                          className={[
                            styles.btnOpt,
                            this.state[`feedbackOpt${record.questionId}`] ==
                              1 || record.studentFeedback == 1
                              ? styles.blurOpt
                              : "",
                          ].join(" ")}
                          onClick={(e) =>
                            this.clickBtnOpt(1, record.questionId, e)
                          }
                        >
                          <i className={styles.iconfont}>&#xeaf1;</i>
                          {trans("global.right", "正确")}
                        </span>
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            ),
            // props: {
            //   colSpan: hoverIndexID == record.questionId ? 2 : 1,
            // },
          };
        },
      },
    ];
    // console.log(this.status, "111");
    let isStatus;
    isStatus = this.status == 0 ? false : true;
    let device = window.yg;
    console.log(saveStuRecord, "111");
    return (
      <div className={styles.mistakesCollectionBox}>
        <div className={styles.header}>
          <div className={styles.goBackBox}>
            <span
              onClick={this.back}
              style={device == "ipad" ? { display: "none" } : {}}
            >
              <i className={styles.iconfont}>&#xe6ff;</i>
              <span className={styles.goBack}>
                {trans("global.goBack", "返回")}
              </span>
            </span>
            <span style={{ marginLeft: 20 }}>
              {wrongQuestionVersionDetail.name}
            </span>
          </div>
          <span className={styles.exportKnowledge}>
            <a
              href={`${
                window.location.origin
              }/api/trendComparativeAnalysis/export/errorQuestionList?queryType=${isKnowledgeGrouping}&subjectId=${subjectId}&gradeIdList=${
                this.state.gradeIdList.length == this.props.stuGradeList.length
                  ? ""
                  : this.state.gradeIdList
              }&examTypeList=${
                this.state.typeList.length == this.props.stuTypeList.length
                  ? ""
                  : this.state.typeList
              }&examIdList=${
                this.state.testId[0] == 0 ? "" : this.state.testId
              }`}
              target="_blank"
              rel="noreferrer"
            >
              <span>{trans("global.downloadErrorQuestion", "下载错题")}</span>
            </a>
          </span>
        </div>
        <div className={styles.homePage}>
          {this.status == 0 || this.status == 1 ? (
            <div className={styles.stuList} style={{ width: "200px" }}>
              <div className={styles.searchCondition}>
                <Select
                  className={styles.selectStuStyle}
                  placeholder={trans("global.searchStu", "搜索学生")}
                  showSearch
                  filterOption={false}
                  value={searchStuId}
                  onSearch={this.handleSearch}
                  onSelect={this.changeStu}
                >
                  {searchList &&
                    searchList.length > 0 &&
                    searchList.map((item, index) => (
                      <Option
                        key={item.userId}
                        value={item.userId}
                        title={item.userName}
                      >
                        {item.userName}
                      </Option>
                    ))}
                </Select>
                {this.status == 0 ? (
                  <div style={{ display: "flex" }}>
                    <Select
                      placeholder={trans(
                        "wrongTable.selectGrade",
                        "请选择年级",
                      )}
                      onChange={(value) => this.changeCondition(value, "grade")}
                      value={gradeId}
                      className={styles.selectGrade}
                      dropdownMatchSelectWidth={false}
                      dropdownStyle={{ width: "200px" }}
                    >
                      <Option value="">
                        {trans("global.allGrade", "全部年级")}
                      </Option>

                      {studentGroupList && studentGroupList.length > 0
                        ? studentGroupList.map((item, index) => {
                            if (
                              item.name == "小班" ||
                              item.name == "中班" ||
                              item.name == "大班"
                            )
                              return;
                            return (
                              <Option
                                value={item.gradeId}
                                key={item.gradeId}
                                title={
                                  locale() === "en"
                                    ? item.englishName
                                    : item.name
                                }
                              >
                                {locale() === "en"
                                  ? item.englishName
                                  : item.name}
                              </Option>
                            );
                          })
                        : null}
                    </Select>
                    <Select
                      placeholder={trans(
                        "wrongTable.selectClass",
                        "请选择班级",
                      )}
                      onChange={(value) => this.changeCondition(value, "group")}
                      value={groupId}
                      className={styles.selectStyle}
                      dropdownMatchSelectWidth={false}
                      dropdownStyle={{ width: "200px" }}
                    >
                      <Option value="" key="">
                        {trans("global.allClass", "全部班级")}
                      </Option>
                      {gradeId != "" && groupList && groupList.length > 0
                        ? groupList.map((item, index) => (
                            <Option
                              value={item.studentGroupId}
                              key={index}
                              title={
                                locale() === "en" ? item.englishName : item.name
                              }
                            >
                              {locale() === "en" ? item.englishName : item.name}
                            </Option>
                          ))
                        : null}
                    </Select>
                  </div>
                ) : null}
              </div>

              <div className={styles.menuList}>
                <Spin spinning={loading} tip="loading...">
                  <div
                    className={
                      studentId == ""
                        ? `${styles.menu} ${styles.activeMenu}`
                        : styles.menu
                    }
                    onClick={() => this.changeStudentId("")}
                  >
                    <span className={`${styles.cover} ${styles.all}`}>
                      <i className={styles.iconfont}>&#xe678;</i>
                    </span>
                    <span className={styles.name}>
                      {trans("global.allStudents", "全部学生")}
                    </span>
                  </div>
                  {studentList && studentList.length > 0
                    ? studentList.map((item, index) => {
                        let defaultImg =
                          item.sex && item.sex == 1
                            ? "https://assets.yungu.org/statics/0.0.1/task/boy.png"
                            : "https://assets.yungu.org/statics/0.0.1/task/girl.png";
                        let name = locale() === "en" ? item.ename : item.name;
                        return (
                          <div
                            className={
                              studentId == item.userId
                                ? `${styles.menu} ${styles.activeMenu}`
                                : styles.menu
                            }
                            key={index}
                            onClick={() => this.changeStudentId(item.userId)}
                          >
                            <span className={styles.cover}>
                              <img
                                src={
                                  item.userAvatar ? item.userAvatar : defaultImg
                                }
                                onError={(e) => this.checkError(e, defaultImg)}
                                alt="头像"
                              />
                            </span>
                            <Tooltip title={item.userName}>
                              <span className={styles.name}>
                                {name ? name : item.userName}
                              </span>
                            </Tooltip>
                          </div>
                        );
                      })
                    : null}
                </Spin>
              </div>
            </div>
          ) : null}
          <div
            style={{
              flex: 1,
              marginLeft: 10,
              width: "calc(~'100% - 210px')",
            }}
            className={styles.rightBox}
          >
            <div className={styles.wrongQuestionBox}>
              {isStatus ? null : (
                <div className={styles.tabSub}>
                  {allSubjectList &&
                    allSubjectList.length > 0 &&
                    allSubjectList.map((item) => (
                      <span
                        className={styles.subBox}
                        style={
                          subjectId == item.id
                            ? {
                                color: "#0445FC",
                                background: "rgb(212, 223, 253)",
                              }
                            : null
                        }
                        onClick={() => this.clickSub(item.id)}
                      >
                        {item.name}
                      </span>
                    ))}
                </div>
              )}
              {this.status == 0 || this.status == 1 ? (
                <div
                  className={styles.selectData}
                  style={isSelect ? null : { padding: "5px 10px" }}
                >
                  {isSelect ? (
                    <div>
                      <div className={styles.rowSelect}>
                        <span className={styles.leftName}>
                          {trans("global.grade", "年级")}
                        </span>
                        <Checkbox
                          indeterminate={this.state.indeterminate}
                          onChange={(e) => this.allGardeChange(e, newGradeList)}
                          checked={checkAllGardes}
                          disabled={isStatus}
                        >
                          {trans("global.allGrade", "全部年级")}
                        </Checkbox>
                        <Checkbox.Group
                          options={newGradeList}
                          value={gradeIdList}
                          onChange={(e) => this.changeGrade(e, newGradeList)}
                          disabled={isStatus}
                        />
                      </div>
                      <div className={styles.rowSelect}>
                        <span className={styles.leftName}>
                          {trans("global.examType", "类型")}
                        </span>
                        <Checkbox
                          indeterminate={this.state.indeterminate1}
                          onChange={(e) => this.allTypeChange(e, newTypeList)}
                          checked={checkAllType}
                          disabled={isStatus}
                        >
                          {trans("global.allType", "全部类型")}
                        </Checkbox>
                        <Checkbox.Group
                          options={newTypeList}
                          value={typeList}
                          onChange={(e) => this.changeType(e, newTypeList)}
                          disabled={isStatus}
                        />
                      </div>
                      <div className={styles.rowSelect1}>
                        <span className={styles.leftName}>
                          {trans("global.test", "试卷")}
                        </span>
                        <Select
                          mode="multiple"
                          style={{ maxWidth: "90%", width: "50%" }}
                          placeholder={trans(
                            "global.pleaseSelectTest",
                            "请选择试卷",
                          )}
                          onChange={(e) => this.changeTest(e, stuNameList)}
                          value={testId}
                          disabled={isStatus}
                        >
                          <Option key={0}>
                            {trans("global.allTestPaper", "全部试卷")}
                          </Option>
                          {stuNameList &&
                            stuNameList.length > 0 &&
                            stuNameList.map((item) => (
                              <Option key={item.examId}>{item.examName}</Option>
                            ))}
                        </Select>
                      </div>
                      {isStatus ? null : (
                        <div className={styles.saveBtn}>
                          {isPushStatus ? (
                            <span className={styles.hasBeenSent}>
                              {trans("global.hasBeenSent", "已发送")}
                            </span>
                          ) : (
                            <span
                              className={styles.criteriaBtn}
                              onClick={this.clickCriteriaBtn}
                            >
                              {trans("global.savedCriteria", "保存查询条件")}
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={styles.retractBox}
                        onClick={this.clickRetract}
                      >
                        <i
                          className={[styles.iconfont, styles.retract].join(
                            " ",
                          )}
                        >
                          &#xe614;
                        </i>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={styles.retractBox}
                      onClick={this.clickRetract}
                    >
                      <i
                        className={[styles.iconfont, styles.retract].join(" ")}
                      >
                        &#xe613;
                      </i>
                    </div>
                  )}
                </div>
              ) : null}
              <div className={styles.mistakesCollection}>
                <div className={styles.tipDimension}>
                  <i className={styles.iconfont} style={{ fontSize: 12 }}>
                    &#xe870;
                  </i>
                  {trans(
                    "wrongTable.filterSummary",
                    "共筛选到{$examNum}份试卷，试题总数{$questionNum}题，错题总数{$errorQuestionNum}题。",
                    {
                      examNum: String(errorQuestionList?.examNum ?? 0),
                      questionNum: String(errorQuestionList?.questionNum ?? 0),
                      errorQuestionNum: String(
                        errorQuestionList?.errorQuestionNum ?? 0,
                      ),
                    },
                  )}
                </div>
                <div
                  className={styles.errorTable}
                  style={
                    this.status == 0 || this.status == 1
                      ? { height: "calc(100vh - 270px)" }
                      : { height: "calc(100vh - 105px)" }
                  }
                >
                  <Table
                    columns={newcolumns}
                    dataSource={errDetialList}
                    bordered={true}
                    align={"center"}
                    pagination={false}
                    onRow={this.onRow}
                  />
                  <div className={styles.paginations}>
                    <Pagination
                      size="small"
                      pageSize={this.state.pageSizeErr}
                      current={this.state.pageNoErr}
                      total={errorQuestionList.errorQuestionNum || 0}
                      onChange={this.changeNoErr}
                      showSizeChanger
                      showQuickJumper
                      onShowSizeChange={this.onShowSizeErrChange}
                      pageSizeOptions={[50, 100, 150, 200]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 保存查询条件+发送学生 */}
        <Modal
          visible={isQueryCriteria}
          // visible={true}
          className={styles.queryCriteriaModal}
          footer={null}
          closable={false}
          bodyStyle={{ padding: 0 }}
          width={660}
          getContainer={false}
          destroyOnClose={true}
        >
          <StuConditionSelect
            // groupList={this.props.studentGroupListAndStudentList} //学生列表
            // visible={this.state.isStuStudy} // 开关
            modalVisible={this.handleCriteriaBtn} //关闭方法
            disabledStu={[]} //禁用学生
            publishText={trans("global.batchDownload", "批量下载")} //发布
            sureStu={this.handleCriteriaBtn} //发布完后的内容
            // search={this.searchStuName} //搜索
            onRef={this.onRef1} //
            ifDeadLine={true}
            dispatch={this.props.dispatch}
            studentId={studentId}
            subjectId={subjectId}
            gradeIdList={this.state.gradeIdList}
            queryType={isKnowledgeGrouping}
            examIdList={this.state.testId}
            examTypeList={this.state.typeList}
            newGradeList={newGradeList}
            newTypeList={newTypeList}
            stuNameList={stuNameList}
            saveStuRecord={saveStuRecord}
            pushStatus={this.pushStatus}
            teacherView={1}
          />
        </Modal>
      </div>
    );
  }
}

export default connect(({ home, global, studentLearning }) => ({
  stuGradeList: global.stuGradeList,
  stuTypeList: global.stuTypeList,
  stuNameList: global.stuNameList,
  errorQuestionList: global.errorQuestionList,
  hoverIndex: home.hoverIndex,
  stuAllWrongQuestionVersion: global.stuAllWrongQuestionVersion,
  wrongQuestionVersionDetail: global.wrongQuestionVersionDetail,
  allSubjectList: studentLearning.allSubjectList,
  studentGroupList: global.studentGroupList,
  userList: global.userList,
  pushedStudentList: global.pushedStudentList,
}))(WrongTable);
