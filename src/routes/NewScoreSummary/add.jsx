// 类组件
import React from "react";
import {
  Checkbox,
  DatePicker,
  Form,
  Icon,
  Input,
  message,
  Select,
  Spin,
} from "antd";
import moment from "moment";

import MyButton from "../../components/MyButton";
import {
  examInfoListByGrade,
  summaryCreatOrUpdate,
  summaryDetail,
} from "../../services/exam";
import { queryExamOptions, querySubjectByGrade } from "../../services/example";
import { locale, trans } from "../../utils/i18n";

import styles from "./add.module.less";
const { Option } = Select;
const { RangePicker } = DatePicker;

const formItemLayout = {
  labelCol: {
    xs: { span: locale() === "en" ? 5 : 5 },
    sm: { span: locale() === "en" ? 3 : 2 },
  },
  wrapperCol: {
    xs: { span: locale() === "en" ? 18 : 18 },
    sm: { span: locale() === "en" ? 21 : 10 },
  },
};

let defaultCheckedList1 = [];
let plainOptions1 = [];

let GRADSUBJECTS = {};
class ScoreSummaryAdd extends React.Component {
  constructor(properties) {
    super(properties);
    const { id, gradeId, reportType, semesterId } = this.props.match.params;
    this.id = id;
    this.gradeId = gradeId;
    this.state = {
      applyGrades: defaultCheckedList1,
      gradeIndeterminate: false,
      gradeCheckAll: false,
      gradeList: [],
      semesterList: [],
      defaultSemester: {},
      // stageList: [],
      summaryDetail: [
        // {
        //     gradeId: 0,
        //     examDetails: [{
        //         "examIds": [],
        //         "subjectId": 0‘,
        //         "subjectName": '',
        //     }],
        //     subjectMergeRequest: [{ "subjectId": [] }]
        // }
      ], //汇总详情
      gradeToSubjects: {
        // 1921: [{
        //     id: '',
        //     name: ''
        // }]
      }, //用来存储年级下的学科
      // paperTypeList: [],
      semesterId: semesterId,
      reportType: reportType,
      reportName: undefined,
      examDateStar: undefined,
      examDateEnd: undefined,
      examDate: [],
      loading: false,
      examInfoList: {},
    };
  }

  async componentDidMount() {
    await this.getSemesterList();

    // 汇总报告id  id为null 系统生成的汇总报告  id不为null 手动创建的汇总报告  id不存在时新增页面
    if (this.id) {
      this.setState({
        loading: true,
      });

      await this.getDetail();

      let newSemester = {};
      if (this.state.semesterList && this.state.semesterList.length > 0) {
        this.state.semesterList?.map((item) => {
          if (item.semesterId === this.state.semesterId) {
            newSemester = item;
          }
        });
      }
      this.setState({
        defaultSemester: newSemester,
      });
      this.setState({
        loading: false,
      });

      // 循环每一个年级下面要合并的，将已经合并的学科进行隐藏掉
      if (this.state.summaryDetail)
        for (const [index, item] of this.state.summaryDetail.entries()) {
          if (item.subjectMergeRequest)
            for (const [index_, item1] of item.subjectMergeRequest.entries()) {
              this.subjectMergeChange(item1.subjectId, item.gradeId, index_);
            }
        }

      this.setState({
        loading: false,
      });
    } else {
      // 默认展示当前学期
      if (this.state.semesterList?.length) {
        for (const item of this.state.semesterList) {
          if (item.current) {
            this.formChange("semesterId", item.semesterId);
          }
        }
      }
    }
  }

  getExamList = async ({
    semesterId,
    startTime,
    endTime,
    gradeIdList,
  } = {}) => {
    return new Promise((resolve, reject) => {
      // 获取测验列表，用于关联试卷
      examInfoListByGrade({
        pageNo: 1,
        limit: 9_999_999,
        hasScoreSummary: 1,
        examTypeCode: this.state.reportType,
        semesterId:
          semesterId == undefined ? this.state.semesterId : semesterId,
        startTime: startTime == undefined ? this.state.examDateStar : startTime,
        endTime: endTime == undefined ? this.state.examDateEnd : examDateEnd,
        gradeIdList:
          gradeIdList == undefined ? this.state.applyGrades : gradeIdList,
      }).then((res) => {
        if (res.status) {
          this.setState(
            {
              examInfoList: res.content,
            },
            () => {
              resolve(res);
            },
          );
        } else {
          reject(res);
          message.error(res.message);
        }
      });
    });
  };

  // 获取学期
  getSemesterList = () => {
    return new Promise((resolve, reject) => {
      queryExamOptions({ gradeJudge: true }).then((res) => {
        if (res.status) {
          this.setState(
            {
              semesterList: res.content,
            },
            () => {
              resolve(res);
            },
          );
        } else {
          reject(res);
          message.error(res.message);
        }
      });
    });
  };

  //  定义函数：根据学期获取对应的年级列表
  getGradesBySemester = (semesterId) => {
    let list = [];
    if (this.state.semesterList)
      for (const item of this.state.semesterList) {
        if (semesterId == item.semesterId) {
          list = item.gradeList;
        }
      }
    return list;
  };

  // 获取详情接口
  getDetail = () => {
    return new Promise((resolve, reject) => {
      let parameters = {};
      // 系统生成的汇总报告页面编辑规则
      if (this.id === "null") {
        parameters.gradeId = this.gradeId;
        parameters.reportType = this.state.reportType;
        parameters.semesterId = this.state.semesterId;
      } else {
        parameters.id = this.id;
      }
      summaryDetail(parameters).then(async (res) => {
        if (res.status) {
          const {
            summaryDetail,
            semesterId,
            reportName,
            examDateStar,
            examDateEnd,
            reportType,
            applyGrades,
          } = res.content;

          const dateObject = new Date(examDateStar);
          // 获取年、月、日
          const year = dateObject.getFullYear();
          const month = String(dateObject.getMonth() + 1).padStart(2, "0"); // 月份从0开始，需要+1并且补零
          const day = String(dateObject.getDate()).padStart(2, "0"); // 补零
          // 组合成 YYYY-MM-DD 格式
          const formattedDate = `${year}-${month}-${day}`;

          const dateObject1 = new Date(examDateEnd);
          const year1 = dateObject1.getFullYear();
          const month1 = String(dateObject1.getMonth() + 1).padStart(2, "0"); // 月份从0开始，需要+1并且补零
          const day1 = String(dateObject1.getDate()).padStart(2, "0"); // 补零
          const formattedDate1 = `${year1}-${month1}-${day1}`;

          let list = this.getGradesBySemester(semesterId);
          plainOptions1 = list?.map((item) => item.gradeId);
          await this.getExamList({
            semesterId: semesterId,
            gradeIdList: plainOptions1,
          });
          // 备份全选时候要用的年级数据
          // let _this = this

          // 保证所有年纪下的学科数据获取到位，用于处理每个年纪下合并学科的数据
          await new Promise((resolve, reject) => {
            for (const [ii, gra] of list.entries()) {
              this.getSubjectsByGrade(gra.gradeId).then((res) => {
                if (Object.keys(GRADSUBJECTS).length == list.length - 1) {
                  resolve();
                }
              });
            }
          });

          if (summaryDetail)
            for (const [index, gradeItem] of summaryDetail.entries()) {
              // 默认展开前六个
              gradeItem.expand = true;
              // 详情接口和新增接口数据结构不一样，需要调整
              if (gradeItem.examDetails)
                for (const subjectItem of gradeItem.examDetails) {
                  if (subjectItem.examDetailList) {
                    let array = subjectItem.examDetailList?.map(
                      (item2) => item2.examId,
                    );
                    // 年级下的学科未匹配到则进行过滤，避免只出现id未匹配到测验
                    let ids = array?.filter((examId) => {
                      if (
                        this.state.examInfoList &&
                        this.state.examInfoList[gradeItem.gradeId]
                      ) {
                        return this.state.examInfoList[gradeItem.gradeId].find(
                          (exam) => exam.examId == examId,
                        );
                      }
                      return false;
                    });
                    subjectItem.examIds = ids;

                    // 编辑的时候不需要进行默认匹配
                    // 如果年级下学科没有关联则进行默认匹配
                    // if (JSON.stringify(subjectItem.examIds) == '[]' || !Boolean(subjectItem.examIds)) {
                    //     let arr = []
                    //     if (this.state.examInfoList && this.state.examInfoList[gradeItem.gradeId]) {
                    //         this.state.examInfoList[gradeItem.gradeId]?.forEach(item4 => {
                    //             if (item4.examName?.includes(subjectItem.subjectName)) {
                    //                 arr.push(item4.examId)
                    //             }
                    //         })
                    //     }
                    //     subjectItem.examIds = arr
                    // }
                  }
                }
              if (gradeItem.subjectMergeRequest)
                for (const mergeItem of gradeItem.subjectMergeRequest) {
                  if (mergeItem.subjectDetail?.length) {
                    mergeItem.subjectId = mergeItem.subjectDetail?.map(
                      (item) => item.subjectId,
                    );
                  }
                }
            }

          this.setState(
            {
              gradeList: list,
              gradeIndeterminate:
                applyGrades.length > 0 && applyGrades.length < list.length,
              summaryDetail: summaryDetail,
              semesterId: semesterId,
              reportName: reportName,
              reportType: reportType,
              examDateStar: examDateStar,
              examDateEnd: examDateEnd,
              applyGrades: applyGrades,
              examDate:
                examDateStar && examDateEnd
                  ? [
                      moment(formattedDate, "YYYY/MM/DD"),
                      moment(formattedDate1, "YYYY/MM/DD"),
                    ]
                  : [],
            },
            () => {
              resolve(res);
            },
          );
        } else {
          reject(res);
          message.error(res.message);
        }
      });
    });
  };

  getSubjectsByGrade = (gradeId) => {
    return new Promise((resolve, reject) => {
      querySubjectByGrade({ gradeId: gradeId }).then((res) => {
        if (res.status) {
          this.setState(
            {
              gradeToSubjects: {
                ...this.state.gradeToSubjects,
                [gradeId]: res.content,
              },
            },
            () => {
              resolve();
            },
          );
          GRADSUBJECTS = { ...GRADSUBJECTS, [gradeId]: res.content };
        } else {
          reject();
          message.error(res.message);
        }
      });
    });
  };

  back = () => {
    window.close();
  };

  editChange = () => {};

  submit = () => {
    let parameters = {
      reportName: this.state.reportName,
      semesterId: this.state.semesterId,
      reportType: this.state.reportType,
      examDateStar: this.state.examDateStar,
      examDateEnd: this.state.examDateEnd,
      // applyStages: this.state.applyStages,
      applyGrades: this.state.applyGrades,
      summaryDetail: this.state.summaryDetail,
    };

    if (!this.state.semesterId) {
      return message.error(
        trans("scoreSummaryAdd.semesterRequired", "请选择学期"),
      );
    } else if (!this.state.reportName) {
      return message.error(
        trans("scoreSummaryAdd.reportNameRequired", "请选择名称"),
      );
    } else if (!this.state.examDateStar || !this.state.examDateEnd) {
      return message.error(
        trans("scoreSummaryAdd.examTimeRequired", "请选择考试时间"),
      );
    } else if (!this.state.reportType) {
      return message.error(
        trans("scoreSummaryAdd.reportTypeRequired", "请选择报告类型"),
      );
    } else if (!this.state.applyGrades || this.state.applyGrades.length === 0) {
      return message.error(
        trans("scoreSummaryAdd.applyGradesRequired", "请选择适用年级"),
      );
    }
    if (this.id) {
      parameters.id = this.id;
    }

    summaryCreatOrUpdate(parameters).then((res) => {
      if (res.status) {
        message.success(trans("scoreSummaryAdd.operationSuccess", "操作成功"));
        setTimeout(() => {
          if (window.opener) {
            window.opener.location?.reload();
          }
          window.close();
        }, 800);
      } else {
        message.error(res.message);
      }
    });
  };

  onCheckAllChange = (e) => {
    this.setState({
      applyGrades: e.target.checked ? plainOptions1 : [],
      gradeIndeterminate: false,
      gradeCheckAll: e.target.checked,
    });

    // 重置内容
    if (e.target.checked) {
      let array = plainOptions1?.map((id) => ({
        gradeId: id,
        expand: true,
        examDetails: this.state.gradeToSubjects[id]?.map((subject) => ({
          examIds: undefined,
          subjectId: subject.id,
          subjectName: subject.name,
        })),
        subjectMergeRequest: [{ subjectId: [] }],
      }));
      this.setState({
        summaryDetail: array,
      });
    } else {
      this.setState({
        gradeToSubjects: GRADSUBJECTS,
        summaryDetail: [],
      });
    }
  };

  onCheckChange = (checkedList) => {
    let cloneSummaryDetail = JSON.parse(
      JSON.stringify(this.state.summaryDetail),
    );
    // 遍历 cloneSummaryDetail 并过滤出在 id 集合中的元素
    let updatedArray = cloneSummaryDetail.filter((item) =>
      checkedList.includes(item.gradeId),
    );
    // 遍历集合，如果 id 不在 updatedArray 中则添加到 updatedArray
    if (checkedList)
      for (const [index, id] of checkedList.entries()) {
        if (!updatedArray.some((item) => item.gradeId === id)) {
          updatedArray.splice(index, 0, {
            gradeId: id,
            examDetails: this.state.gradeToSubjects[id]?.map((subject) => {
              // 如果年级下学科没有关联则进行默认匹配
              let array = [];
              if (
                this.state.examInfoList &&
                this.state.examInfoList[id] &&
                this.state.examInfoList[id]
              )
                for (const item4 of this.state.examInfoList[id]) {
                  if (item4.examName?.includes(subject.name)) {
                    array.push(item4.examId);
                  }
                }
              return {
                examIds: array && array.length > 0 ? array : undefined,
                subjectId: subject.id,
                subjectName: subject.name,
              };
            }),
            expand: true,
            subjectMergeRequest: [{ subjectId: [] }],
          });
        }
      }

    this.setState({
      applyGrades: checkedList,
      gradeIndeterminate:
        checkedList.length > 0 && checkedList.length < plainOptions1.length,
      gradeCheckAll: checkedList.length === plainOptions1.length,
      summaryDetail: updatedArray,
    });
  };

  expandChange = (id, type) => {
    let cloneSummaryDetail = JSON.parse(
      JSON.stringify(this.state.summaryDetail),
    );
    console.log(cloneSummaryDetail);
    if (cloneSummaryDetail)
      for (const [index, item] of cloneSummaryDetail.entries()) {
        if (item.gradeId == id) {
          if (type == "headereExpand") {
            item.expand = !item.expand;
          } else if (type == "contentExpand") {
            item.expand1 = !item.expand1;
          }
        }
      }
    this.setState({
      summaryDetail: cloneSummaryDetail,
    });
  };

  addSubjectMerge = (gradeId) => {
    let cloneSummaryDetail = JSON.parse(
      JSON.stringify(this.state.summaryDetail),
    );
    if (cloneSummaryDetail)
      for (const item of cloneSummaryDetail) {
        if (item.gradeId == gradeId) {
          item.subjectMergeRequest = [
            ...(item.subjectMergeRequest || []),
            { subjectId: [] },
          ];
        }
      }
    this.setState({
      summaryDetail: cloneSummaryDetail,
    });
  };

  subjectMergeChange = (ids, gradeId, index) => {
    let cloneGradeToSubjects = JSON.parse(
      JSON.stringify(this.state.gradeToSubjects),
    );
    let cloneSummaryDetail = JSON.parse(
      JSON.stringify(this.state.summaryDetail),
    );
    let subjectMergeId = []; //当前年级下所有已经被合并过的学科
    if (cloneSummaryDetail)
      for (const item of cloneSummaryDetail) {
        if (item.gradeId == gradeId) {
          item.subjectMergeRequest[index].subjectId = ids;

          if (item.subjectMergeRequest)
            for (const item1 of item.subjectMergeRequest) {
              subjectMergeId = [...subjectMergeId, ...item1.subjectId];
            }
        }
      }
    let list = cloneGradeToSubjects[gradeId];
    if (list)
      for (const item of list) {
        // 当前年级下被合并过的学科要禁用掉
        item.disabled = subjectMergeId.includes(item.id) ? true : false;
      }
    cloneGradeToSubjects[gradeId] = list;

    this.setState({
      gradeToSubjects: cloneGradeToSubjects,
      summaryDetail: cloneSummaryDetail,
    });
  };

  gradeToSubjectsFilter = (gradeId) => {
    let list = [];
    if (this.state.summaryDetail)
      for (const item of this.state.summaryDetail) {
        if (item.gradeId === gradeId) {
          list = item.subjectMergeRequest || [];
        }
      }
    return list;
  };

  selectPaperChange = (value, index, index_) => {
    let cloneSummaryDetail = JSON.parse(
      JSON.stringify(this.state.summaryDetail),
    );
    cloneSummaryDetail[index].examDetails[index_].examIds = value;
    this.setState({
      summaryDetail: cloneSummaryDetail,
    });
  };

  getNmae = (id) => {
    let name = "";
    if (this.state.gradeList)
      for (const item of this.state.gradeList) {
        if (item.gradeId == id) {
          name = item.gradeName;
        }
      }
    return name;
  };

  formChange = (key, e) => {
    if (key == "reportName") {
      this.setState({
        reportName: e.target.value,
      });
    } else if (key == "semesterId") {
      let newSemester = {};
      if (this.state.semesterList && this.state.semesterList.length > 0) {
        this.state.semesterList?.map((item) => {
          if (item.semesterId === e) {
            newSemester = item;
          }
        });
      }

      let list = this.getGradesBySemester(e);

      plainOptions1 = list?.map((item) => item.gradeId);

      this.setState(
        {
          gradeList: list,
          semesterId: e,
          defaultSemester: newSemester,
        },
        () => {
          this.getExamList({ gradeIdList: plainOptions1 });
        },
      );

      this.setState({
        loading: true,
      });
      // 根据年级获取年级下的学科
      list?.forEach(async (item, index) => {
        await this.getSubjectsByGrade(item.gradeId);
        // 年级下的学科还没获取完成就选中了年级,导致程序报错
        if (index == list.length - 1) {
          this.setState({
            loading: false,
          });
        }
      });
    } else if (key == "reportType") {
      this.setState(
        {
          reportType: e,
        },
        () => {
          this.getExamList({ gradeIdList: plainOptions1 });
        },
      );
    } else if (key == "examDate") {
      console.log("examDate", e); //['2024-06-20', '2024-06-20']
      this.setState({
        examDateStar: new Date(e[0]).getTime(),
        examDateEnd: new Date(e[1]).getTime(),
        examDate:
          e[0] && e[1]
            ? [moment(e[0], "YYYY/MM/DD"), moment(e[1], "YYYY/MM/DD")]
            : [],
      });
    }
  };
  getOptions = (item, element) => {
    // console.log(this.state.examInfoList[item.gradeId], 'arrr');
    // console.log(item.gradeId, element.subjectId, element.subjectName, 'arrr');
    if (this.state.examInfoList && this.state.examInfoList[item.gradeId]) {
      let array = this.state.examInfoList[item.gradeId].filter(
        (it) => it.subjectId == element.subjectId,
      );
      console.log(array, "arr");
      if (array && array.length > 0) {
        return array.map((examInfo) => (
          <Option
            value={examInfo.examId}
            key={examInfo.examId}
            label={examInfo.examName}
          >
            {examInfo.examName}
          </Option>
        ));
      }
    }

    return [];
  };
  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "rgb(245, 245, 245)",
        }}
      >
        <div className={styles.header}>
          <div className={[styles.closeIcon].join(" ")} onClick={this.back}>
            <Icon type="close" />
          </div>
          <div className={[styles.viewTitle].join(" ")}>
            {this.id
              ? trans("global.editNewScoreSummaryReport", "编辑成绩汇总报告")
              : trans("global.AddaNewScoreSummaryReport", "新建成绩汇总报告")}
          </div>

          <div className={styles.headeRight}>
            <MyButton
              sizeclass="commonBtn"
              typeclass="minor"
              onClick={this.back}
            >
              {trans("global.cancel", "取消")}
            </MyButton>
            <MyButton
              sizeclass="commonBtn"
              typeclass="confirmBtn"
              onClick={this.submit}
            >
              {trans("global.save", "保存")}
            </MyButton>
          </div>
        </div>
        <div
          style={{
            width: "100%",
            height: "calc(100% - 76px)",
            padding: "0 5%",
            overflow: "auto",
            marginTop: "12px",
          }}
        >
          <div className={styles.formContent}>
            <Form {...formItemLayout} colon={false}>
              <Form.Item
                label={trans("global.reportName", "报告名称")}
                required
              >
                <Input
                  onChange={(e) => this.formChange("reportName", e)}
                  placeholder={trans("global.reportName", "报告名称")}
                  value={this.state.reportName}
                />
              </Form.Item>
              <Form.Item
                label={trans("global.selectSemester", "选择学期")}
                required
              >
                <Select
                  style={{ width: "258px" }}
                  placeholder={trans("global.selectSemester", "选择学期")}
                  onChange={(e) => this.formChange("semesterId", e)}
                  value={this.state.semesterId}
                >
                  {this.state.semesterList?.map((item) => (
                    <Option value={item.semesterId} key={item.semesterId}>
                      {item.semesterName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label={trans("global.reportType", "报告类型")}
                required
              >
                <Select
                  style={{ width: "258px" }}
                  placeholder={trans("global.reportType", "报告类型")}
                  onChange={(e) => this.formChange("reportType", e)}
                  value={this.state.reportType}
                >
                  {this.state.defaultSemester.examType &&
                    this.state.defaultSemester.examType.length &&
                    this.state.defaultSemester.examType.map((item) => (
                      <Option value={item.examTypeCode} key={item.examTypeCode}>
                        {item.examTypeName}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
              <Form.Item label={trans("global.examTime", "考试时间")} required>
                <RangePicker
                  onChange={(date, dateString) =>
                    this.formChange("examDate", dateString)
                  }
                  value={this.state.examDate}
                />
              </Form.Item>

              <Form.Item
                label={trans("global.applicableGrade", "适用年级")}
                required
                labelCol={{
                  xs: { span: locale() === "en" ? 5 : 5 },
                  sm: { span: locale() === "en" ? 3 : 2 },
                }}
                wrapperCol={{
                  xs: { span: locale() === "en" ? 19 : 19 },
                  sm: { span: locale() === "en" ? 21 : 22 },
                }}
              >
                <div
                  style={
                    this.state.loading
                      ? { background: "#e6f7ff", border: "1px solid #91d5ff" }
                      : {}
                  }
                >
                  <Spin
                    spinning={this.state.loading}
                    tip="根据年级获取学科数据..."
                  >
                    <div className={styles.gradeCheckedContent}>
                      <Checkbox
                        disabled={Boolean(this.id)}
                        indeterminate={this.state.gradeIndeterminate}
                        onChange={(e) => {
                          this.onCheckAllChange(e);
                        }}
                        checked={this.state.gradeCheckAll}
                        className={styles.checkAllBox}
                      >
                        {trans("global.selectAll", "全选")}
                      </Checkbox>
                      <Checkbox.Group
                        disabled={Boolean(this.id)}
                        className={styles.checkboxGroupBox}
                        options={this.state.gradeList?.map((item) => ({
                          label: item.gradeName,
                          value: item.gradeId,
                        }))}
                        value={this.state.applyGrades}
                        onChange={(checkedList) => {
                          this.onCheckChange(checkedList);
                        }}
                      ></Checkbox.Group>
                    </div>
                  </Spin>
                </div>
              </Form.Item>
            </Form>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "12px",
              marginBottom: "12px",
            }}
          >
            {this.state.summaryDetail?.map((item, index) => {
              return (
                <div
                  style={{
                    width: "100%",
                    borderBottom: "1px solid rgba(1, 17, 61, 0.05)",
                  }}
                  key={item.gradeId}
                >
                  <div
                    style={{
                      background: "#fff",
                      height: "44px",
                      padding: "10px 12px",
                      width: "100%",
                    }}
                  >
                    <span
                      onClick={() => {
                        this.expandChange(item.gradeId, "headereExpand");
                      }}
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        lineHeight: "24px",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ marginRight: "10px" }}>
                        {item.expand ? (
                          <Icon type="down" />
                        ) : (
                          <Icon type="up" />
                        )}
                      </span>
                      {this.getNmae(item.gradeId)}
                    </span>
                  </div>

                  <div
                    style={{ display: item.expand ? "block" : "none" }}
                    className={styles.contentBox}
                  >
                    <div className={styles.tableWarp}>
                      <table className={styles.table}>
                        <thead className={styles.tabletHead}>
                          <tr>
                            <th
                              scope="col"
                              style={{
                                width: "285px",
                                borderRight: "1px solid rgba(1, 17, 61, 0.04)",
                              }}
                            >
                              {trans("global.subject", "学科")}
                            </th>
                            <th scope="col" style={{ width: "453px" }}>
                              {trans(
                                "scoreSummaryAdd.associateWithTestPaper",
                                "关联试卷",
                              )}
                              <span style={{ color: "" }}>
                                {trans(
                                  "scoreSummaryAdd.optionalSubjectHint",
                                  "（不需要汇总成绩的学科，不关联留空即可）",
                                )}
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className={styles.tabletBody}>
                          {item.examDetails?.map((element, index_) => {
                            if (!item.expand1 && index_ > 5) return;
                            return (
                              <tr
                                key={`${item.gradeId}${element.subjectId}`}
                                style={{
                                  borderBottom:
                                    "1px solid rgba(1, 17, 61, 0.04)",
                                  height: "40px",
                                  position: "relative",
                                }}
                              >
                                <td
                                  style={{
                                    width: "285px",
                                    borderRight:
                                      "1px solid rgba(1, 17, 61, 0.04)",
                                  }}
                                >
                                  {item.expand1 ? (
                                    index_ == item.examDetails.length - 1 ? (
                                      <div
                                        onClick={() => {
                                          this.expandChange(
                                            item.gradeId,
                                            "contentExpand",
                                          );
                                        }}
                                        style={{
                                          minWidth: "52px",
                                          height: "40px",
                                          lineHeight: "40px",
                                          position: "absolute",
                                          left: "-68px",
                                          top: "0",
                                          color: "#0445FC",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <Icon type="up" />
                                        {trans("global.collapse", "收起")}
                                      </div>
                                    ) : null
                                  ) : index_ == 5 ? (
                                    <div
                                      onClick={() => {
                                        this.expandChange(
                                          item.gradeId,
                                          "contentExpand",
                                        );
                                      }}
                                      style={{
                                        minWidth: "52px",
                                        height: "40px",
                                        lineHeight: "40px",
                                        position: "absolute",
                                        left: "-68px",
                                        top: "0",
                                        color: "#0445FC",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Icon type="down" />
                                      {trans("global.expand", "展开")}
                                    </div>
                                  ) : null}
                                  {element.subjectName}
                                </td>
                                <td style={{ width: "453px" }}>
                                  <Select
                                    style={{ width: "100%" }}
                                    placeholder={trans(
                                      "global.pleaseChoose",
                                      "请选择",
                                    )}
                                    mode="multiple"
                                    onChange={(value) =>
                                      this.selectPaperChange(
                                        value,
                                        index,
                                        index_,
                                      )
                                    }
                                    optionFilterProp="label"
                                    value={
                                      element.examIds
                                        ? element.examIds
                                        : undefined
                                    } //避免空字符串不展示placeholder内容
                                  >
                                    {this.getOptions(item, element)}
                                  </Select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div className={styles.title}>
                        {trans(
                          "scoreSummaryAdd.mergeSubjectsTitle",
                          "设置分数需要合并的学科",
                        )}
                      </div>
                      <div>
                        {this.gradeToSubjectsFilter(item.gradeId)?.map(
                          (subjectMerge, index) => {
                            return (
                              <Select
                                key={index}
                                style={{
                                  width: "258px",
                                  margin: "0 8px 8px 0",
                                }}
                                mode="multiple"
                                placeholder={trans(
                                  "scoreSummaryAdd.mergeSubjectsPlaceholder",
                                  "选择合并学科",
                                )}
                                value={subjectMerge.subjectId}
                                onChange={(value, option) => {
                                  this.subjectMergeChange(
                                    value,
                                    item.gradeId,
                                    index,
                                  );
                                }}
                              >
                                {this.state.gradeToSubjects[item.gradeId]?.map(
                                  (subject) => {
                                    return (
                                      <Option
                                        style={{
                                          display: subject.disabled
                                            ? "none"
                                            : "block",
                                        }}
                                        key={subject.id}
                                        value={subject.id}
                                        label={subject.name}
                                      >
                                        {subject.name}
                                      </Option>
                                    );
                                  },
                                )}
                              </Select>
                            );
                          },
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            color: "#0445FC",
                            marginTop: "12px",
                            cursor: "pointer",
                            display: "inline-block",
                          }}
                          onClick={() => {
                            this.addSubjectMerge(item.gradeId);
                          }}
                        >
                          <i
                            className={[styles.iconfont, styles.addIcon].join(
                              " ",
                            )}
                          >
                            &#xe867;
                          </i>
                          &nbsp;
                          {trans("scoreSummaryAdd.addGroup", "添加一组")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default ScoreSummaryAdd;
