// 用来发起机阅测验的组件

// 单独传入 paperId 默认选中试卷

// id:是一个数字，描述测验id，传入id进行编辑回显
import React from "react";
import {
  Button,
  Col,
  Form,
  Icon,
  Input,
  InputNumber,
  message,
  Popover,
  Radio,
  Row,
  Select,
  Switch,
  Table,
  Tabs,
  Upload,
} from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";
import ComnModal from "../ComnModal";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
import StepProgressBar from "components/StepProgressBar";

import { buildPaperEditorPreviewPath } from "../../routes/PaperEditor/paperEditorPageContext";
import {
  getConfig,
  queryExamInfoByExamId,
  queryPaperList,
} from "../../services/example";
import {
  closeAppraise,
  createAppraise,
  examPaperAnswer,
  machineReading,
} from "../../services/machine";
import { buildHashRouteUrl } from "../../utils/hashRoute";
import { loginRedirect } from "../../utils/utils";
import { initData } from "./data";
const { Option } = Select;
const { TabPane } = Tabs;
const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

export class ModalMachineTest extends React.Component {
  constructor(properties) {
    super(properties);

    this.state = {
      paperList: [],
      tabKey: 1,
      visible: false,
      upLoading: false,
      onOKLoding: false,
      paperId: undefined, //试卷
      examName: undefined,
      examType: undefined, //测验类型
      totalScore: undefined,
      gradeIdList: undefined, //年级
      subjectId: undefined, //科目
      courseIdList: [], //课程
      groupIdList: undefined, //班级
      evaluationItemId: undefined, //'评价项',后端需要数组，我也不知道为什么。由于前端是单选，所以要在外面包一层数组
      evaluationItemName: null,
      evaluationCategoryId: undefined, //评价维度
      evaluationCriterionId: undefined, //学生显示
      needAppraise: undefined, //评价开关，
      total: undefined, //满分｜评价相关
      stuNo: true,
      secrecy: true,
      weights: 0,
      id: undefined,
      tableLoading: false,
      childrenEvaluateList: [],
      columns: [
        {
          title: trans("global.versionNumber", "版本号"),
          dataIndex: "examNum",
          key: "examNum",
        },
        {
          title: trans("global.createTime", "创建时间"),
          dataIndex: "createDate",
          key: "createDate",
        },
        {
          title: trans("modalMachineTest.originalPaper", "原卷"),
          dataIndex: "originalTest",
          key: "originalTest",
          render: (text, record) => (
            <span
              className={styles.downloadSpan}
              onClick={() => this.downloadTest(record, "原卷", record.wordFile)}
            >
              {trans("global.download", "下载")}
            </span>
          ),
        },
        {
          title: trans("global.printedVolume", "印刷卷"),
          dataIndex: "printingTest",
          key: "printingTest",
          render: (text, record) => (
            <span
              className={styles.downloadSpan}
              onClick={() => {
                if (!record.needMark) {
                  this.downloadTest(
                    record,
                    trans("global.printedVolume", "印刷卷"),
                    record.pdfFile,
                  );
                }
              }}
            >
              {trans("global.download", "下载")}
            </span>
          ),
        },
        {
          title: trans("global.operation", "操作"),
          render: (text, record) =>
            record.isMarkShow ? (
              <span
                className={styles.downloadSpan}
                onClick={() =>
                  this.downloadTest(record, "批阅打标", record.makePaperUrl)
                }
              >
                {trans("global.markingAndMarking", "批阅打标")}
              </span>
            ) : (
              trans("global.markingAndMarking", "批阅打标")
            ),
        },
      ],
      answerSheetResponse: null,
      evaluationCourseId: undefined,
    };
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  // static getDerivedStateFromProps(nextProps, nextState) {
  //     let obj = {}
  //     if (nextProps.modalMachineTestProps.tabKey != nextProps.tabKey) {
  //         obj.tabKey = nextProps.modalMachineTestProps.tabKey
  //     }
  //     return obj
  // }
  UNSAFE_componentWillMount() {
    // 如果不是编辑进来则将同步评价默认为true
    if (!(this.props.modalMachineTestProps || {}).id) {
      this.setState({
        needAppraise: true,
      });
    }
  }
  componentDidMount() {
    this.getPaperListFun();
    this.getExamTypeFun();
    this.getAllGradeFun();
    this.getPermission();

    if (this.props.modalMachineTestProps.tabKey) {
      this.setState({
        tabKey: this.props.modalMachineTestProps.tabKey,
      });
    }
    const { modalMachineTestProps } = this.props;
    // id:  表示当前界面是否处于编辑状态。
    if ((modalMachineTestProps || {}).id) {
      queryExamInfoByExamId({ examId: modalMachineTestProps.id }).then(
        (res) => {
          if (res.status) {
            const {
              paperId,
              examId,
              groupIdList,
              examName,
              subjectId,
              examAlias,
              wordUrl,
              examType,
              totalScore,
              gradeIdList,
              courseIdList,
              answerSheetResponse,
              semesterId,
              lessonAndAppraiseModel = {},
              courseId,
            } = res.content;

            const { evaluationItemId } = lessonAndAppraiseModel;

            let parameters = {
              id: examId,
              paperId,
              groupIdList,
              examName,
              examAlias,
              subjectId,
              wordUrl,
              examType,
              totalScore: totalScore, //满分
              gradeIdList,
              courseIdList,
              needAppraise: Boolean(
                lessonAndAppraiseModel.evaluationCategoryId,
              ),
              evaluationItemId: lessonAndAppraiseModel.evaluationItemId
                ? [lessonAndAppraiseModel.evaluationItemId]
                : null,
              evaluationItemName: lessonAndAppraiseModel.evaluationItemName,
              evaluationCriterionId:
                lessonAndAppraiseModel.evaluationCriterionId,
              answerSheetResponse,
              evaluationCourseId: lessonAndAppraiseModel?.evaluationCourseId
                ? lessonAndAppraiseModel?.evaluationCourseId
                : courseId, //目标课程为空取课程
            };

            // 后加入二级评价维度，根据parentEvaluationCategoryId区分是否选择了二级评价维度
            if (lessonAndAppraiseModel.parentEvaluationCategoryId) {
              // 如果选择了二级评价维度，需要将一级评价维度的id赋值给evaluationCategoryId
              parameters.evaluationCategoryId =
                lessonAndAppraiseModel.parentEvaluationCategoryId;
              parameters.childEvaluationCategoryId =
                lessonAndAppraiseModel.evaluationCategoryId;
            } else {
              parameters.evaluationCategoryId =
                lessonAndAppraiseModel.evaluationCategoryId;
            }

            this.setState({
              ...parameters,
            });

            // 获取班级对应学科
            this.props.dispatch({
              type: "home/getSubjectByStage",
              payload: {
                gradeIdList: gradeIdList,
              },
              callback: (res) => {
                console.log(res, "1");
              },
            });

            // 获取学科对应课程
            this.props.dispatch({
              type: "publishToStudent/getCourseList",
              payload: {
                subjectId: subjectId,
                courserId: courseId,
              },
            });

            // 根据 课程 科目 年级 获取班级
            this.props.dispatch({
              type: "home/getGradeClass",
              payload: {
                gradeIdList: gradeIdList,
                subjectId: subjectId,
                courseIdList: courseIdList,
              },
            });

            // 确保接口入参优值，避免接口报系统异常
            if (
              lessonAndAppraiseModel?.evaluationCourseId ||
              lessonAndAppraiseModel?.courseId ||
              courseId
            ) {
              // 根据课程获取评价维度
              this.props.dispatch({
                type: "home/getSelectEvaluationCategoryByExample",
                payload: {
                  //先取目标课程id 找不到去找试卷的课程id 试卷的找不到再找测验的课程id
                  courseId:
                    lessonAndAppraiseModel?.evaluationCourseId ||
                    lessonAndAppraiseModel?.courseId ||
                    courseId,
                  semesterId: semesterId,
                },
                callback: (res) => {
                  let result = res.content.find(
                    (item) => item.id == parameters.evaluationCategoryId,
                  );
                  let list = result ? result.childrenList : [];
                  if (list && list.length > 0) {
                    this.setState({
                      childrenEvaluateList: list,
                    });
                  }
                },
              });
            }

            //获取学生端显示list
            this.getCriterionList(
              lessonAndAppraiseModel?.courseId
                ? lessonAndAppraiseModel?.courseId
                : courseId,
            );

            // 确保评价维度存在值，避免后端接口报异常
            if (
              parameters.childEvaluationCategoryId ||
              parameters.evaluationCategoryId
            ) {
              // 根据评价维度获取评价项
              this.props
                .dispatch({
                  type: "home/getEvaluationItemListByCategoryId",
                  payload: {
                    evaluationCategoryId:
                      parameters.childEvaluationCategoryId ||
                      parameters.evaluationCategoryId,
                  },
                })
                .then(() => {
                  for (const item of this.props.evaluationItemList) {
                    if (item.id == evaluationItemId) {
                      this.setState({
                        weights: item.weights,
                      });
                    }
                  }
                });
            }
          } else {
            message.error(`${res.message}`);
          }
        },
      );
      return;
    }

    //paperId: 表示当前选中的试卷id
    if ((modalMachineTestProps || {}).paperId) {
      this.changeSelectTest(modalMachineTestProps.paperId);
    }
  }

  getPermission = () => {
    getConfig({
      type: 6,
      schoolLevel: true,
      businessId: "",
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          const { examAliasSwitch } = response.content;
          this.setState({
            examAliasSwitch: examAliasSwitch,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  downloadTest = (record, text, herfUrl) => {
    this.props
      .dispatch({
        type: "home/getExamLog",
        payload: {
          paperId: record.paperId,
          type: text,
          examNum: record.examNum,
        },
      })
      .then(() => {
        window.open(herfUrl);
      });
  };

  // 获取所有测验类型
  getExamTypeFun = () => {
    this.props.dispatch({
      type: "home/getExamType",
      payload: {
        type: 1,
      },
    });
  };

  // 获取所有试卷
  getPaperListFun = () => {
    //坑！ 这里不能用dispach获取数据，会导致串改列表页数据
    queryPaperList({
      semesterId: null,
      gradeId: null,
      examTypeCode: null,
      subjectId: null,
      examName: "",
      viewType: 2,
      pageNo: 1, //pageNo是当前页码
      limit: 5000, //limit是每页的数据数量
      hasEditExam: 1,
    }).then((res) => {
      if (res.status) {
        this.setState({
          paperList: res.content.examList,
        });
        console.log(res, "===========");
      }
    });
  };

  // 获取所有年级
  getAllGradeFun = () => {
    // queryAllGrade().then(res=>{  })
    this.props.dispatch({
      type: "home/getAllGrade",
      payload: {
        // paperId: this.props.inquireId,
      },
    });
  };

  handleSubmit = (e) => {
    const { tabKey } = this.state;
    const {
      id,
      paperId,
      groupIdList,
      subjectId,
      wordUrl,
      examType,
      examName,
      examAlias,
      totalScore,
      gradeIdList,
      courseIdList,
      needAppraise,
      evaluationItemId,
      evaluationCategoryId,
      evaluationCriterionId,
      total,
      evaluationCourseId,
      weights,
      evaluationItemName,
      childEvaluationCategoryId,
    } = this.state;
    if (tabKey === 1) {
      if (!paperId) {
        return message.error(trans("modalTest.selectPaper", "请选择试卷"));
      }
      if (!examName) {
        return message.error(
          trans("modalTest.enterExamName", "请填写测验名称"),
        );
      }
      if (!examType) {
        return message.error(
          trans("modalTest.selectExamType", "请选择测验类型"),
        );
      }
      if (!totalScore) {
        return message.error(trans("modalTest.enterFullScore", "请输入满分"));
      }
      if (!gradeIdList || gradeIdList?.length === 0) {
        return message.error(trans("modalTest.selectGrade", "请选择年级"));
      }
      if (!subjectId) {
        return message.error(trans("modalTest.selectSubject", "请选择学科"));
      }
      if (!courseIdList || courseIdList?.length === 0) {
        return message.error(trans("modalTest.selectCourse", "请选择课程"));
      }
      if (!groupIdList || groupIdList?.length === 0) {
        return message.error(trans("modalTest.selectClass", "请选择班级"));
      }

      this.setState({
        onOKLoding: true,
      });

      machineReading({
        id: id ? id : null, // 存在id 则为编辑，不存在则为新增
        paperId,
        groupIdList,
        examName,
        examAlias,
        subjectId,
        wordUrl,
        outStudentNoType: "barcode",
        whetherOrNotPrivate: true,
        examType,
        madePlatformUtil: true,
        totalScore,
        gradeIdList,
        courseIdList,
      }).then((res) => {
        this.setState({
          onOKLoding: false,
        });
        if (res.status) {
          // 新增成功，将测验新增数据生成的id存下
          const { examId } = res.content;
          this.setState({
            tabKey: 2,
            id: examId,
          });
        } else {
          message.error(res.message);
        }
      });
    } else if (tabKey === 2) {
      this.setState({
        tabKey: 3,
      });
    } else {
      if (!needAppraise) {
        this.setState({
          onOKLoding: true,
        });
        return closeAppraise(id).then((res) => {
          this.setState({
            onOKLoding: false,
          });
          if (res.status) {
            this.props.modalMachineTestProps.options.onOk();
          } else {
            message.error(res.message);
          }
        });
      }
      if (needAppraise) {
        if (!evaluationCourseId) {
          return message.error(
            trans("modalTest.selectTargetCourse", "请选择目标课程"),
          );
        }
        if (!evaluationCategoryId) {
          return message.error(
            trans("modalTest.selectEvaluationDimension", "请选择评价维度"),
          );
        }
        if (!evaluationCriterionId && evaluationCriterionId === undefined) {
          return message.error(
            trans("modalTest.selectStudentDisplay", "请选择学生显示"),
          );
        }
      }
      this.setState({
        onOKLoding: true,
      });

      createAppraise({
        examId: id,
        appraiseResponse: [
          {
            evaluationItemId:
              evaluationItemId &&
              evaluationItemId.length > 0 &&
              evaluationItemId[0]
                ? evaluationItemId
                : [examName], //评价项id:如果是创建评价项目，实际传给后端的是测验名称。
            evaluationItemName:
              evaluationItemId &&
              evaluationItemId.length > 0 &&
              evaluationItemId[0]
                ? evaluationItemName
                : examName, //如果是创建评价项目，传给后端测验名称，如果不是则传给后端评价项名称。
            // 后加入的二级评价维度，但是参数还是用的一级的参数，判断是否选中了二级评价维度，选中了传二级评价维度。
            evaluationCategoryId: childEvaluationCategoryId
              ? childEvaluationCategoryId
              : evaluationCategoryId,
            evaluationCriterionId,
            total: totalScore,
            weights,
            evaluationCourseId,
          },
        ],
      }).then((res) => {
        this.setState({
          onOKLoding: false,
        });
        if (res.status) {
          this.props.modalMachineTestProps.options.onOk();
        } else {
          message.error(res.message);
        }
      });
    }
  };

  // 根据评价维度id获取type
  idBasedOnType = (id) => {
    const { evaluateList } = this.props;
    const result = evaluateList.find((item) => item.id === id);
    if (result) {
      const { calculationType } = result;
      if (calculationType === 2) {
        return true;
      }
    }
    return false;
  };

  // 此方法负责清空联动数据,
  clearLink = (changeKey, callBack) => {
    // 关联关系表
    const clearData = initData[changeKey];
    if (clearData) {
      const data = {};
      for (const item of clearData) {
        data[item.key] = item.value;
      }
      this.setState(
        {
          ...data,
        },
        () => {
          callBack();
        },
      );
    } else {
      callBack();
    }
  };

  // 选择试卷
  changeSelectTest = (id) => {
    console.log("changeSelectTest", id);
    this.clearLink("paperId", () => {
      this.setState({
        paperId: id,
      });
      // 获取当前试卷详情
      this.props
        .dispatch({
          type: "home/getPaperInfo",
          payload: {
            paperId: id,
          },
        })
        .then(() => {
          const { paperInfo } = this.props;
          const {
            subjectId,
            examPaperName,
            examType,
            gradeIdList,
            totalScore,
          } = paperInfo;

          // 根据年级获取学科数据
          this.props.dispatch({
            type: "home/getSubjectByStage",
            payload: {
              gradeIdList: gradeIdList,
            },
          });

          // 根据学科id获取课程
          this.props.dispatch({
            type: "publishToStudent/getCourseList",
            payload: {
              subjectId: subjectId,
            },
          });

          this.setState({
            subjectId,
            examName: examPaperName,
            examType,
            gradeIdList: gradeIdList || [],
            totalScore,
          });
          console.log(this.props.paperInfo);
        });
    });
  };

  // 选择学科
  changeSubjectModal = (id) => {
    this.clearLink("subjectId", () => {
      this.setState({
        subjectId: id,
      });
      // 获取学科对应课程
      this.props.dispatch({
        type: "publishToStudent/getCourseList",
        payload: {
          subjectId: id,
        },
      });
    });
  };

  // 测验名称
  changeExamTestName = (e) => {
    this.setState({
      examName: e.target.value,
    });
  };

  changeExamAliasName = (e) => {
    this.setState({
      examAlias: e.target.value,
    });
  };

  // 选择班级
  changeClass = (value) => {
    this.setState({
      groupIdList: value,
    });
  };
  // 测验类型
  changeExamType = (value) => {
    this.setState({
      examType: value,
    });
  };

  //满分
  changeTotalScoreEvaluate = (value) => {
    this.setState({
      totalScore: value,
    });
  };

  // 总分
  changeTotal = (value) => {
    this.setState({
      total: value,
    });
  };

  // 选择年级
  changeGrade = (checkedValues) => {
    this.clearLink("gradeIdList", () => {
      this.setState({
        gradeIdList: checkedValues,
      });

      this.props.dispatch({
        type: "home/getSubjectByStage",
        payload: {
          gradeIdList: checkedValues,
          //   paperId: this.props.inquireId,
        },
        callback: (res) => {
          console.log(res, "1");
        },
      });
    });
  };

  // 选择课程
  changeChooseCourse = (value) => {
    this.clearLink("courseIdList", () => {
      this.setState({
        courseIdList: value ? [value] : [], //后端需要数组，这里考虑以后会选择多个课程
      });

      // 根据 课程 科目 年级 获取班级
      this.props.dispatch({
        type: "home/getGradeClass",
        payload: {
          gradeIdList: this.state.gradeIdList,
          subjectId: this.state.subjectId,
          courseIdList: [value],
        },
      });
    });
  };

  //学生显示
  changeStudentDisplay = (id) => {
    this.setState({
      evaluationCriterionId: id,
    });
  };

  // 评价开关
  iFNeedAppraiseChange = (value) => {
    this.setState({
      needAppraise: value,
    });
  };

  // 维度占比
  changeProportionDimensions = (value) => {
    this.setState({
      weights: value,
    });
  };

  // 选择评价维度
  changeEvaluationDimension = (id, a) => {
    this.clearLink("evaluationCategoryId", () => {
      this.setState({
        evaluationCategoryId: id,
        evaluationItemId: [0], // 默认为新建评价项
      });

      let result = this.props.evaluateList.find((item) => item.id == id);
      let list = result ? result.childrenList : [];
      if (list && list.length > 0) {
        this.setState({
          childrenEvaluateList: list,
        });
      } else {
        this.setState({
          childrenEvaluateList: [],
        });
        // 根据评价维度获取评价项
        this.props.dispatch({
          type: "home/getEvaluationItemListByCategoryId",
          payload: {
            evaluationCategoryId: id,
          },
        });
      }
    });
  };

  // 选择子评价维度
  changeChildEvaluationDimension = (value) => {
    this.clearLink("childEvaluationCategoryId", () => {
      this.setState({
        childEvaluationCategoryId: value,
        evaluationItemId: [0], // 默认为新建评价项
      });

      // 根据评价维度获取评价项
      this.props.dispatch({
        type: "home/getEvaluationItemListByCategoryId",
        payload: {
          evaluationCategoryId: value,
        },
      });
    });
  };

  // 评价项
  changeEvaluationDimensionId = (option) => {
    this.clearLink("evaluationItemId", () => {
      this.setState({
        evaluationItemId: [option.key],
        evaluationItemName: option.label,
      });

      const { evaluationItemList } = this.props;
      if (option.key == 0) {
        this.setState({
          weights: null,
          // total: null,
          evaluationCriterionId: undefined,
        });
      } else if (evaluationItemList && evaluationItemList.length > 0) {
        // 根据评价项 得到 总分 ｜ 维度占比  ｜ 学生显示
        evaluationItemList.map((item) => {
          if (item.id == option.key) {
            this.setState({
              weights: item.weights,
              // total: item.total,
              evaluationCriterionId: item.evaluationCriterionId,
            });
          }
        });
      }
    });
  };

  onCancel = () => {
    const { options } = this.props.modalMachineTestProps;
    const { tabKey } = this.state;
    if (tabKey == 1) {
      options.onCancel();
    } else {
      this.setState({
        tabKey: tabKey - 1,
      });
    }
  };

  // 预览试卷
  clickPreviewTestPaper = () => {
    window.open(
      buildHashRouteUrl(buildPaperEditorPreviewPath(this.state.paperId)),
    );
  };

  uploadOnChange = (info) => {
    console.log(info, "ii");

    const { paperId, id, gradeIdList, subjectId } = this.state;
    const { status, response, name } = info.file;
    if (status === "uploading") {
      this.setState({
        upLoading: true,
      });
    }

    if (status === "done" && response.status && response.ifLogin) {
      const { content } = response;

      // 获取答题卡上传后的信息
      examPaperAnswer({
        id: id, //测验id
        paperId: paperId,
        examPaperAnswerSheetFileId:
          content && content.length > 0 ? content[0].fileId : null,
        gradeIdList: gradeIdList,
        subjectId: subjectId,
        wordUrl: content && content.length > 0 ? content[0].url : null,
        madePlatformUtil: true,
        outStudentNoType: "barcode",
        whetherOrNotPrivate: true,
      }).then((res) => {
        if (res.status) {
          this.setState({
            answerSheetResponse: res.content,
          });
        } else {
          message.error(res.message);
        }
        this.setState({
          upLoading: false,
        });
      });
    } else if (info.file.status === "error") {
      message.error(`${name} ${response.message}`);
      this.setState({
        upLoading: false,
      });
      window._czc &&
        window._czc.push([
          "_trackEvent",
          "上传附件",
          "添加附件",
          info.file.name,
        ]);
    }
  };

  beforeUpload = (maxSize, file) => {
    if (file.size / 1024 / 1024 <= maxSize) {
      return true;
    } else {
      message.info(trans("global.fileLarge", "上传文件过大！"));
      return false;
    }
  };

  // 查看答题卡历史版本
  lookAnswerSheet = () => {
    this.setState({
      tableLoading: true,
    });
    this.props
      .dispatch({
        type: "home/historyTestList",
        payload: {
          paperId: this.state.paperId,
          isEdit: true,
        },
      })
      .then(() => {
        this.setState({
          tableLoading: false,
        });
      });
  };
  changeTab = (value) => {
    this.setState({
      tabKey: value.key,
    });
  };
  answerSheetPreview = (data) => {
    let url = null;
    if ((data || {}).wordPdfUrl) {
      url = (data || {}).wordPdfUrl;
    } else if ((data || {}).pdfFile) {
      url = (data || {}).pdfFile;
    }
    window.open(url);
  };

  //获取学生展示list
  getCriterionList = (courseId) => {
    this.props
      .dispatch({
        type: "home/getOptions",
      })
      .then(() => {
        const { examOptions } = this.props;
        let semesterInfo =
          examOptions && examOptions.length > 0
            ? examOptions.find((item) => item.current === true) || {}
            : {};
        let semesterId = semesterInfo.semesterId;
        this.props.dispatch({
          type: "home/getCriterionList",
          payload: {
            courseId: courseId,
            semesterId: semesterId,
          },
        });
      });
  };

  changeTargetCourse = (value) => {
    this.clearLink("evaluationCourseId", () => {
      this.setState({
        evaluationCourseId: value,
        childrenEvaluateList: [],
      });

      // 根据课程获取评价维度
      this.props.dispatch({
        type: "home/getSelectEvaluationCategoryByExample",
        payload: { courseId: value },
      });

      //获取学生端显示list
      this.getCriterionList(value);
    });
  };
  render() {
    const {
      modalMachineTestProps,
      examTypeList,
      allGrade,
      stageSubjectList,
      courseList,
      classList,
      evaluateList,
      criterionList,
      evaluationItemList,
      historyTestList,
    } = this.props;

    // console.log('upLoadeDetail', upLoadeDetail);
    const { options } = modalMachineTestProps;

    const {
      tabKey,
      paperId,
      examName,
      examType,
      columns,
      examAliasSwitch,
      totalScore,
      gradeIdList,
      subjectId,
      courseIdList,
      paperList,
      evaluationCourseId,
      groupIdList,
      evaluationCategoryId,
      evaluationCriterionId,
      tableLoading,
      answerSheetResponse,
      examAlias,
      evaluationItemId,
      needAppraise,
      weights,
      upLoading,
      childEvaluationCategoryId,
      onOKLoding,
    } = this.state;

    const uploadProperties = {
      name: "file",
      action: "/api/upload_file",
      multiple: true,
      accept: "file/*",
      showUploadList: false,
      headers: {
        authorization: "authorization-text",
      },
      onChange: this.uploadOnChange,
      beforeUpload: this.beforeUpload.bind(this, 20),
    };

    return (
      <ComnModal
        options={{
          ...options,
          okText:
            tabKey == 3
              ? needAppraise
                ? trans("global.initiateSync", "发起成绩同步")
                : trans("global.ok", "确认")
              : trans("activity.nextBtn", "下一步"),
          cancelText:
            tabKey == 1
              ? trans("global.cancle", "取消")
              : trans("global.previousStep", "上一步"),
          okButtonProps: {
            loading: onOKLoding,
          },
          style: { top: "10px" },
          // centered: true,
          onOk: this.handleSubmit, // 提交表单
          cancelButtonProps: {
            // 点击取消按钮
            onClick: this.onCancel,
          },
          wrapClassName: "modalMachineTest",
        }}
        innerContent={
          <>
            <StepProgressBar
              data={[
                { tab: trans("global.quizSettings", "填写测验设置"), key: 1 },
                {
                  tab: trans("global.uploadAnswerSheet", "上传答题卡"),
                  key: 2,
                },
                { tab: trans("global.scoreEaluation", "成绩同步评价"), key: 3 },
              ]}
              onChange={(value) => {
                this.changeTab(value);
              }}
              activeKey={tabKey}
              style={{ marginTop: "13px" }}
            />
            <div className={styles.modalContentBody}>
              <Form
                {...formItemLayout}
                style={{ display: tabKey == 1 ? "block" : "none" }}
                colon={false}
              >
                <Form.Item
                  label={trans("global.test", "试卷")}
                  wrapperCol={{ span: 18 }}
                  required
                >
                  <Col span={16}>
                    <Select
                      showSearch
                      placeholder={trans(
                        "modalTest.selectPaperPlaceholder",
                        "选择试卷",
                      )}
                      onChange={this.changeSelectTest}
                      value={paperId}
                      filterOption={(input, option) =>
                        option.props.children
                          ?.toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {paperList && paperList.length > 0
                        ? paperList.map((item) => (
                            <Option
                              value={item.id}
                              key={item.id}
                              title={item.title}
                            >
                              {item.title}
                            </Option>
                          ))
                        : null}
                    </Select>
                  </Col>
                  {/* 选中试卷后可以预览 */}
                  {paperId ? (
                    <span
                      style={{
                        color: "#0445fc",
                        cursor: "pointer",
                        paddingLeft: "10px",
                        lineHeight: "32px",
                      }}
                      onClick={this.clickPreviewTestPaper}
                    >
                      &nbsp; {trans("global.previewTestPaper", "预览试卷")}
                    </span>
                  ) : null}
                </Form.Item>
                <Form.Item
                  label={trans("global.testName", "测验名称")}
                  wrapperCol={{ span: 12 }}
                  required
                >
                  <Input
                    placeholder={trans("global.pleaseEnter", "请输入")}
                    onChange={this.changeExamTestName}
                    value={examName}
                  />
                </Form.Item>

                {examAliasSwitch ? (
                  <Form.Item
                    label={trans("global.quizAlias", "测验别名")}
                    wrapperCol={{ span: 12 }}
                  >
                    <Input
                      placeholder={trans("global.pleaseEnter", "请输入")}
                      onChange={this.changeExamAliasName}
                      value={examAlias}
                    />
                  </Form.Item>
                ) : null}

                <Row>
                  <Col span={12}>
                    <Form.Item
                      label={trans("global.testType", "测验类型")}
                      wrapperCol={{ span: 16 }}
                      labelCol={{ span: 8 }}
                      required
                    >
                      <Select
                        showSearch
                        placeholder={trans("global.selectType", "选择类型")}
                        onChange={this.changeExamType}
                        value={examType}
                        filterOption={(input, option) =>
                          option.props.children
                            ?.toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {examTypeList && examTypeList.length > 0
                          ? examTypeList.map((item) => (
                              <Option value={item.code} key={item.code}>
                                {item.typeName}
                              </Option>
                            ))
                          : null}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={trans("global.manfen", "满分")}
                      required
                      wrapperCol={{ span: 16 }}
                      labelCol={{ span: 5 }}
                    >
                      <InputNumber
                        placeholder={trans("global.pleaseEnter", "请输入")}
                        onChange={this.changeTotalScoreEvaluate}
                        value={totalScore}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>
                    <Form.Item
                      label={trans("global.grade", "年级")}
                      required
                      wrapperCol={{ span: 16 }}
                      labelCol={{ span: 8 }}
                    >
                      <Select
                        mode="multiple"
                        placeholder={trans("global.selectGrade", "选择年级")}
                        onChange={this.changeGrade}
                        value={gradeIdList || []}
                      >
                        {allGrade && allGrade.length > 0
                          ? allGrade.map((item) => (
                              <Option value={item.gradeId} key={item.gradeId}>
                                {language ? item.gradeName : item.gradeEnName}
                              </Option>
                            ))
                          : null}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={trans("global.subject", "学科")}
                      wrapperCol={{ span: 16 }}
                      labelCol={{ span: 5 }}
                      required
                    >
                      <Select
                        placeholder={trans(
                          "global.selectDiscipline",
                          "选择学科",
                        )}
                        onChange={this.changeSubjectModal}
                        value={subjectId}
                        showSearch
                        filterOption={(input, option) => {
                          return (
                            option.props.children
                              ?.toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0
                          );
                        }}
                      >
                        {stageSubjectList && stageSubjectList.length > 0
                          ? stageSubjectList.map((item) => (
                              <Option value={item.id} key={item.id}>
                                {item.name}
                              </Option>
                            ))
                          : null}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  label={trans("global.course", "课程")}
                  wrapperCol={{ span: 12 }}
                  required
                >
                  <Select
                    // mode="multiple"
                    showSearch
                    placeholder={trans("global.chooseCourse", "选择课程")}
                    onChange={this.changeChooseCourse}
                    value={(courseIdList || [])[0]}
                    filterOption={(input, option) => {
                      return (
                        option.props.children
                          ?.toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      );
                    }}
                  >
                    {courseList && courseList.length > 0
                      ? courseList.map((item) => (
                          <Option value={item.courseId} key={item.courseId}>
                            {item.courseName}
                          </Option>
                        ))
                      : null}
                  </Select>
                </Form.Item>
                <Form.Item
                  label={trans("global.group", "班级")}
                  wrapperCol={{
                    span: (groupIdList || []).length > 3 ? 19 : 12,
                  }} //根据选中的班级数量改变容器宽度
                  required
                >
                  <Select
                    mode="multiple"
                    showSearch
                    placeholder={trans(
                      "global.chooseClass",
                      "选择参与考试的班级",
                    )}
                    onChange={this.changeClass}
                    value={groupIdList || []}
                    filterOption={(input, option) => {
                      return (
                        option.props.children
                          ?.toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      );
                    }}
                  >
                    {classList && classList.length > 0
                      ? classList.map((item) => (
                          <Option value={item.groupId} key={item.groupId}>
                            {language ? item.groupName : item.groupEnName}
                          </Option>
                        ))
                      : null}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={trans("global.studentNumber", "学号")}
                  required
                  className="lh21"
                >
                  <Radio checked>
                    {trans("global.pasteBarCodeOrQRcode", "贴条形码或二维码")}
                  </Radio>
                </Form.Item>
                <Form.Item
                  label={trans("global.privacyRequirements", "保密要求")}
                  required
                  className="lh21"
                >
                  <Radio checked>{trans("global.secrecy", "保密")}</Radio>
                </Form.Item>
              </Form>
              <div
                className={styles.uploadContent}
                style={{ display: tabKey == 2 ? "block" : "none" }}
              >
                <div className={styles.textStyle}>
                  <span className={styles.label}>①</span>
                  <span className={styles.text}>
                    {trans(
                      "modalMachineTest.downloadGeneratedAnswerSheet",
                      "下载系统自动生成的答题卡",
                    )}
                  </span>
                  <Button
                    size="small"
                    onClick={() => {
                      window.top.open(
                        `${window.location.origin}/api/exam/convert/word/export?paperId=${paperId}`,
                      );
                    }}
                  >
                    {trans("global.downloadNow", "立即下载")}
                  </Button>
                </div>

                <div className={styles.textStyle}>
                  <span className={styles.label}>②</span>
                  <span className={styles.text}>
                    {trans(
                      "modalMachineTest.adjustAnswerSheetInWord",
                      "在本地Word文档中调整答题卡答案区域",
                    )}
                  </span>
                </div>
                <div
                  className={styles.textStyle}
                  style={{ marginBottom: "12px" }}
                >
                  <span className={styles.label}>③</span>
                  <span className={styles.text}>
                    {trans("global.adjustedAnswerSheet", "上传调整后的答题卡")}
                  </span>
                  <Upload {...uploadProperties}>
                    <Button size="small" disabled={upLoading}>
                      <Icon type={upLoading ? "loading" : "upload"} />
                      {answerSheetResponse
                        ? trans("global.uploadAgain", "重新上传")
                        : trans("global.uploadNow", "立即上传")}
                    </Button>
                  </Upload>
                </div>
                <div>
                  {answerSheetResponse ? (
                    <ul className={styles.fileContent}>
                      <li>
                        <span className={styles.label}>
                          {trans("detail.answerSheet", "答题卡")}
                        </span>
                        <div className={styles.fileName}>
                          {/* <Icon theme="filled" type="close-circle" onClick={this.deleteFile} className={styles.closeIcon} /> */}
                          {answerSheetResponse.examPaperAnswerSheetFileName}
                        </div>
                      </li>
                      <li>
                        <span className={styles.label}>
                          {trans("global.versionNumber", "版本号")}
                        </span>
                        {answerSheetResponse.examNum}
                      </li>
                      <li>
                        <span className={styles.label}>
                          {trans("global.printedVolume", "印刷卷")}
                        </span>
                        <Button
                          size="small"
                          onClick={this.answerSheetPreview.bind(
                            this,
                            answerSheetResponse,
                          )}
                        >
                          {trans("global.previewAndDownload", "预览并下载")}
                        </Button>
                      </li>
                    </ul>
                  ) : null}
                </div>
                <Popover
                  content={
                    <Table
                      columns={columns}
                      pagination={false}
                      loading={tableLoading}
                      dataSource={historyTestList}
                    />
                  }
                  trigger="click"
                >
                  <div
                    className={styles.historyTag}
                    onClick={this.lookAnswerSheet}
                  >
                    {trans(
                      "global.viewAnswerSheetHistory",
                      "查看答题卡历史版本",
                    )}
                  </div>
                </Popover>
              </div>
              <Form
                style={{ display: tabKey == 3 ? "block" : "none" }}
                colon={false}
                labelCol={{ span: 5 }}
                wrapperCol={{ span: 19 }}
              >
                <div className={styles.remarks}>
                  {trans("global.synchronization", "成绩同步说明")}：<br />
                  1.
                  {trans(
                    "global.synchronizationAfter1",
                    "发起同步后，大概需要2分钟完成数据同步，请进入对应的【课程-评价】刷新查看同步结果；",
                  )}
                  <br />
                  2.{" "}
                  {trans(
                    "global.synchronizationAfter2",
                    "成绩同步开关，可反复操作。",
                  )}
                </div>
                <Form.Item
                  label={trans("global.scoreEaluation", "成绩同步评价")}
                  className="lh16"
                >
                  <Switch
                    style={{
                      visibility:
                        needAppraise == undefined ? "hidden" : "visible",
                    }}
                    checked={needAppraise}
                    size="small"
                    onChange={this.iFNeedAppraiseChange}
                  />
                </Form.Item>
                <div
                  style={{
                    backgroundColor: "rgb(217 217 217 / 30%)",
                    paddingTop: "15px",
                    borderRadius: "10px",
                    margin: "0px 25px",
                    display: needAppraise ? "block" : "none",
                  }}
                >
                  <Row>
                    <Col span={24}>
                      <Form.Item
                        label={trans("global.targetCourse", "目标课程")}
                        wrapperCol={{ span: 15 }}
                        labelCol={{ span: 7 }}
                        required
                      >
                        <Select
                          showSearch
                          placeholder={trans(
                            "global.chooseCourse",
                            "选择目标课程",
                          )}
                          onChange={this.changeTargetCourse}
                          value={evaluationCourseId}
                          filterOption={(input, option) => {
                            return (
                              option.props.children
                                ?.toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        >
                          {courseList && courseList.length > 0
                            ? courseList.map((item) => (
                                <Option
                                  value={item.courseId}
                                  key={item.courseId}
                                >
                                  {item.courseName}
                                </Option>
                              ))
                            : null}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24}>
                      <Form.Item
                        label={trans("global.evaluationDimension", "评价维度")}
                        wrapperCol={{ span: 15 }}
                        labelCol={{ span: 7 }}
                        required
                      >
                        <Select
                          showSearch
                          placeholder={trans(
                            "global.pleaseSelect",
                            "请选择评价维度",
                          )}
                          onChange={this.changeEvaluationDimension}
                          value={evaluationCategoryId}
                          filterOption={(input, option) => {
                            return (
                              option.props.children
                                ?.toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        >
                          {evaluateList && evaluateList.length > 0
                            ? evaluateList.map((item) => (
                                <Option value={item.id} key={item.id}>
                                  {item.name}
                                </Option>
                              ))
                            : null}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {this.state.childrenEvaluateList &&
                  this.state.childrenEvaluateList.length > 0 ? (
                    <Row>
                      <Col span={24}>
                        <Form.Item
                          label={`${trans("global.subDimension", "子维度")}`}
                          wrapperCol={{ span: 15 }}
                          labelCol={{ span: 7 }}
                          required
                        >
                          <Select
                            showSearch
                            placeholder={trans(
                              "global.pleaseSelect",
                              "请选择评价维度",
                            )}
                            onChange={this.changeChildEvaluationDimension}
                            value={childEvaluationCategoryId}
                            filterOption={(input, option) => {
                              return (
                                option.props.children
                                  ?.toLowerCase()
                                  .indexOf(input.toLowerCase()) >= 0
                              );
                            }}
                          >
                            {this.state.childrenEvaluateList.map((item) => (
                              <Option value={item.id} key={item.id}>
                                {item.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  ) : null}

                  <Row>
                    <Col span={12}>
                      <Form.Item
                        label={trans("global.evaluativeItems", "评价项")}
                        wrapperCol={{ span: 14 }}
                        labelCol={{ span: 10 }}
                        required
                      >
                        <Select
                          showSearch
                          labelInValue
                          placeholder={trans(
                            "global.selectEvaluationItem",
                            "请选择评价项",
                          )}
                          onChange={this.changeEvaluationDimensionId}
                          value={{ key: (evaluationItemId || [])[0] }}
                          filterOption={(input, option) => {
                            return (
                              option.props.children
                                ?.toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        >
                          <Option value={0}>
                            {trans(
                              "global.createEvaluationItem",
                              "创建新的评价项",
                            )}
                          </Option>
                          {evaluationItemList && evaluationItemList.length > 0
                            ? evaluationItemList.map((item) => (
                                <Option value={item.id} key={item.id}>
                                  {item.name}
                                </Option>
                              ))
                            : null}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <div
                        style={{
                          display: "inline-block",
                          marginLeft: 10,
                        }}
                      >
                        <span className={styles.remark}>
                          {trans(
                            "global.proportionDimensions",
                            "该维度计算方式为多项求和，此项目占该维度的",
                          )}
                        </span>
                        <InputNumber
                          disabled={Boolean((evaluationItemId || [])[0])}
                          onChange={this.changeProportionDimensions}
                          value={weights}
                          formatter={(value) => `${value}%`}
                          parser={(value) => value.replace("%", "")}
                          max={100}
                          min={0}
                        />
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={8}>
                      <Form.Item
                        label={trans("global.zongfen", "总分")}
                        wrapperCol={{ span: 12 }}
                        labelCol={{ span: 12 }}
                        required
                      >
                        <InputNumber
                          readOnly={true}
                          placeholder={trans("global.pleaseEnter", "请输入")}
                          // onChange={this.changeTotal}
                          // value={total}
                          disabled
                          value={totalScore}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={trans("global.gradingScale", "学生显示")}
                        wrapperCol={{ span: 16 }}
                        labelCol={{ span: 8 }}
                        required
                      >
                        <Select
                          showSearch
                          placeholder={trans("global.pleaseChoose", "请选择")}
                          onChange={this.changeStudentDisplay}
                          value={evaluationCriterionId}
                          filterOption={(input, option) => {
                            return (
                              option.props.children
                                ?.toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        >
                          {criterionList && criterionList.length > 0
                            ? criterionList.map((item) => (
                                <Option value={item.id} key={item.id}>
                                  {locale() == "en" ? item.ename : item.name}
                                </Option>
                              ))
                            : null}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Form>
            </div>
          </>
        }
      />
    );
  }
}

export default connect(({ home, publishToStudent, machine }) => ({
  paperInfo: home.paperInfo,
  examTypeList: home.examTypeList,
  allGrade: home.allGrade,
  stageSubjectList: home.stageSubjectList,
  courseList: publishToStudent.courseList,
  classList: home.classList,
  evaluateList: home.evaluateList,
  criterionList: home.criterionList,
  evaluationItemList: home.evaluationItemListByCategoryId,
  // upLoadeDetail: machine.upLoadeDetail,
  historyTestList: home.historyTestList,
  examOptions: home.examOptions,
}))(Form.create()(ModalMachineTest));
