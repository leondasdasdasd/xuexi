import React, { PureComponent } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  message,
  Pagination,
  Radio,
  Select,
  Spin,
  Table,
  TimePicker,
} from "antd";
import { connect } from "dva";
import moment from "moment";

import { locale, trans } from "../../utils/i18n";
import BatchSettings from "./batchSettings";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { Option } = Select;
const { RangePicker } = DatePicker;
@connect((state) => ({}))
class RuleSettings extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      pageNumber: 1,
      pageSize: 10,
      totalNum: "",
      textPaperVisible: false,
      batchModalVisible: false,
      examSemesterList: [],
      examTypeList: [],
      typeList: [],
      defaultSelectId: null,
      stageList: [],
      defaultStageId: null,
      gradeList: [],
      isGradeId: null,
      tableData: [],
      loading: false,
      dateTime: "",
      time: "",
      defaultValueExamType: [],
    };
  }
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: "home/getExamTypeUpdate",
      onSuccess: (res) => {
        this.setState({
          examTypeList: res || [],
        });
      },
    }).then(() => {
      dispatch({
        type: "home/getSettingRateValue",
        payload: {
          type: 3,
          schoolLevel: true,
        },
        onSuccess: (res) => {
          // console.log(res);
          this.setState(
            {
              typeList: res,
              defaultValueExamType: res || [],
            },
            () => {
              dispatch({
                type: "home/getExamCorrection",
                onSuccess: (res) => {
                  let defaultArray = res.find((item) => item.current == true);
                  this.setState(
                    {
                      examSemesterList: res || [],
                      defaultSelectId: defaultArray && defaultArray.semesterId, //默认学期的id
                      stageList: defaultArray && defaultArray.stageList, //学段列表
                    },
                    () => {
                      const { stageList } = this.state;
                      let newList =
                        (stageList &&
                          stageList.length &&
                          stageList.length > 0 &&
                          stageList[0]) ||
                        {};
                      this.setState(
                        {
                          defaultStageId: newList && newList.stageId, //默认学段id
                          gradeList: (newList && newList.gradeList) || [],
                        },
                        () => {
                          const { gradeList } = this.state;
                          this.setState(
                            {
                              isGradeId:
                                gradeList &&
                                gradeList.length > 0 &&
                                gradeList.length > 0
                                  ? gradeList.at(-1).gradeId
                                  : null, //默认年级id
                            },
                            () => {
                              this.getTableData();
                            },
                          );
                        },
                      );
                    },
                  );
                },
              }).then(() => {});
            },
          );
        },
      });
    });
  }
  getTableData = () => {
    this.setState({
      loading: true,
    });
    const { dispatch } = this.props;
    const {
      pageNumber,
      pageSize,
      isGradeId,
      defaultStageId,
      defaultSelectId,
      typeList,
    } = this.state;
    dispatch({
      type: "home/getExamRuleData",
      payload: {
        pageNo: pageNumber,
        limit: pageSize,
        gradeId: isGradeId,
        // yearPeriodId:
        stageId: defaultStageId,
        semesterId: defaultSelectId,
        examTypeCode: typeList,
      },
      onSuccess: (res) => {
        let data = res && res.examList;
        data &&
          data.length &&
          data.length > 0 &&
          data.map((item, index) => {
            item.No = index + 1;
          });
        this.setState({
          tableData: data || [],
          totalNum: res && res.totalNum,
        });
      },
    }).then(() => {
      this.setState({
        loading: false,
      });
    });
  };
  //切换每页条数
  onShowSizeChange = (current, pageSize) => {
    this.setState(
      {
        pageNumber: current,
        pageSize,
      },
      () => {
        this.getTableData();
      },
    );
  };
  //换页
  paginChange = (pageNumber) => {
    this.setState(
      {
        pageNumber,
      },
      () => {
        this.getTableData();
      },
    );
  };
  //测验类型
  checkBoxChange = (value) => {
    this.setState({
      typeList: value,
    });
  };
  saveExamType = () => {
    this.props.dispatch({
      type: "home/saveSettingRate",
      payload: {
        type: 3,
        config: JSON.stringify(this.state.typeList),
        schoolLevel: true,
      },
      onSuccess: () => {
        this.getTableData();
      },
    });
  };
  selectSemester = (value) => {
    this.setState(
      {
        defaultSelectId: value,
      },
      () => {
        this.getTableData();
      },
    );
  };
  selectGrade = (value) => {
    const { stageList } = this.state;
    console.log(stageList);
    let selectedList = stageList.find((item) => item.stageId == value);
    this.setState(
      {
        gradeList: selectedList && selectedList.gradeList,
        isGradeId:
          selectedList &&
          selectedList.gradeList &&
          selectedList.gradeList.length &&
          selectedList.gradeList.length > 0 &&
          selectedList.gradeList[0].gradeId,
        defaultStageId: value,
      },
      () => {
        this.getTableData();
      },
    );
  };
  //试卷显隐
  testPaperModal = () => {
    this.setState({
      textPaperVisible: true,
    });
  };
  closeModal = () => {
    this.setState({
      textPaperVisible: false,
      batchModalVisible: false,
    });
    this.getTableData();
  };
  batchModal = () => {
    this.setState({
      batchModalVisible: true,
    });
  };
  //表格操作-是否需要审批
  isEvaSelect = (value, record) => {
    let examId = record && record.examId;
    let hasApproval = value == 1 ? true : false;
    let approvalStopTime = record && record.approvalStopTime;
    this.updateData(examId, hasApproval, approvalStopTime);
  };
  updateData = (examId, hasApproval, approvalStopTime) => {
    this.props
      .dispatch({
        type: "home/updateExamTableData",
        payload: {
          examId,
          hasApproval,
          approvalStopTime,
        },
      })
      .then(() => {
        this.setState({
          dateTime: "",
          time: "",
        });
        this.getTableData();
      });
  };
  //是否有截止时间
  isSpecifyRadio = (e, index, record) => {
    const value = e.target.value;
    const { tableData } = this.state;
    let newTableData = JSON.parse(JSON.stringify(tableData));
    newTableData[index].approvalStopTime = value == 1 ? "" : true;
    this.setState({
      tableData: newTableData,
    });
    if (value == 1) {
      let examId = record && record.examId;
      let hasApproval = record && record.hasApproval;
      let approvalStopTime = "";
      this.updateData(examId, hasApproval, approvalStopTime);
    }
  };
  //选择时间-具体日期
  dateChange = (time, timeString, index) => {
    console.log(timeString, index);
    this.setState({
      dateTime: timeString,
    });
  };
  //选择时间-具体小时
  timeChange = (time, timeString, index) => {
    console.log(timeString, index);
    this.setState({
      time: timeString,
    });
  };
  openStatus = (status, index, record) => {
    const { dateTime, time } = this.state;
    // console.log(record.approvalStopTime);
    if (!status) {
      let examId = record && record.examId;
      let hasApproval = record && record.hasApproval;
      let recordDate =
        record.approvalStopTime &&
        record.approvalStopTime != true &&
        record.approvalStopTime.split(" ")[0];
      let leftTime = dateTime || recordDate;
      if (leftTime) {
        let approvalStopTime = moment([leftTime, time].join(" ")).valueOf();
        this.updateData(examId, hasApproval, approvalStopTime);
      } else {
        message.error(trans("ruleSettings.selectDateFirst", "先选择日期"));
      }
    }
  };
  gradeCLick = (data) => {
    // console.log(data);
    this.setState(
      {
        isGradeId: data && data.gradeId,
      },
      () => {
        this.getTableData();
      },
    );
  };
  getExamTypeList = () => {
    const { examTypeList } = this.state;
    const list = [];
    examTypeList &&
      examTypeList.length &&
      examTypeList.length > 0 &&
      examTypeList.map((item, index) => {
        list.push({
          label: item.examTypeName,
          value: item.examTypeCode,
        });
      });
    return list;
  };
  render() {
    const {
      pageNumber,
      textPaperVisible,
      batchModalVisible,
      examSemesterList,
      defaultSelectId,
      stageList,
      defaultStageId,
      gradeList,
      isGradeId,
      defaultGradeId,
      totalNum,
      tableData,
      defaultValueExamType,
    } = this.state;
    const columns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "No",
        key: "No",
        width: 40,
      },
      {
        title: trans("global.examName", "测验名称："),
        dataIndex: "examName",
        key: "name",
        // width: 360,
        render: (t) => {
          return <div className={styles.examName}>{t}</div>;
        },
      },
      {
        title: trans("global.subject", "学科"),
        dataIndex: "subjectName",
        key: "subjectName",
        // width: 50,
      },
      {
        title: trans("global.type", "类型"),
        dataIndex: "examTypeName",
        key: "examTypeName",
        width: 80,
      },
      {
        title: trans("global.createTime", "创建时间"),
        dataIndex: "createDate",
        key: "createDate",
        width: 100,
        render: (t) => {
          return <span>{t ? moment(t).format("YYYY-MM-DD") : null}</span>;
        },
      },
      {
        title: trans("global.approvalRequired", "是否审批"),
        dataIndex: "hasApproval",
        key: "hasApproval",
        width: 130,
        render: (text, record) => {
          return (
            <Select
              style={{ width: 120, borderRadius: "5px", marginRight: "2%" }}
              onChange={(value) => this.isEvaSelect(value, record)}
              defaultValue={text == true ? 1 : text == false ? 2 : ""}
              // key={text}
            >
              <Option value={1}>
                {trans("global.approvalRequiredYes", "需审批")}
              </Option>
              <Option value={2}>
                {trans("global.approvalRequiredNo", "无需审批")}
              </Option>
            </Select>
          );
        },
      },
      {
        title: trans("global.correctionDeadline", "订正截止时间"),
        dataIndex: "approvalStopTime",
        key: "approvalStopTime",
        // width: 450,
        render: (text, record, index) => {
          console.log(text);
          let date = null;
          let time = null;
          if (text != true) {
            date =
              text &&
              text.split(" ").length &&
              text.split(" ").length > 0 &&
              text.split(" ")[0];
            time =
              text &&
              text.split(" ").length &&
              text.split(" ").length > 1 &&
              text.split(" ")[1];
          }
          return (
            <div>
              <Radio.Group
                onChange={(e) => this.isSpecifyRadio(e, index, record)}
                defaultValue={text ? 2 : 1}
                key={text}
              >
                <Radio value={1}>
                  {trans("revisedList.noDeadline", "无截止日期")}
                </Radio>
                <Radio value={2}>
                  {trans("ruleSettings.specificDate", "指定日期")}
                </Radio>
              </Radio.Group>
              {text ? (
                <span>
                  <DatePicker
                    style={{ marginRight: "5px", width: "130px" }}
                    defaultValue={date ? moment(date, "YYYY-MM-DD") : null}
                    key={`${date}-${time}`}
                    onChange={(time, timeString) =>
                      this.dateChange(time, timeString, index)
                    }
                  />
                  <TimePicker
                    style={{ width: "80px" }}
                    onChange={(time, timeString) =>
                      this.timeChange(time, timeString, index)
                    }
                    key={time}
                    defaultValue={time ? moment(time, "HH:mm") : null}
                    onOpenChange={(boolean) =>
                      this.openStatus(boolean, index, record)
                    }
                    format="HH:mm"
                  />
                </span>
              ) : null}
            </div>
          );
        },
      },
    ];
    return (
      <div className={styles.ruleSettings}>
        <div className={styles.checkoutDom}>
          <div className={styles.ifEva}>
            <span>
              {trans(
                "global.requireApprovalforgradecorrection",
                "发起成绩订正时是否需要走审批",
              )}
            </span>
            <Button
              type="primary"
              className={styles.saveUnifiedStyle}
              onClick={this.saveExamType}
            >
              {trans("global.save", "保存")}
            </Button>
          </div>
          <div className={styles.checkboxDom}>
            <span>
              {trans("global.examTypes", "要审批的测验类型")}
              <span style={{ color: "red", marginRight: "10px" }}>*</span>
            </span>
            <div className={styles.customCheckbox}>
              <Checkbox.Group
                options={this.getExamTypeList()}
                defaultValue={defaultValueExamType}
                key={defaultValueExamType}
                onChange={this.checkBoxChange}
              />
            </div>
          </div>
        </div>
        <div className={styles.selectDom}>
          <span className={styles.titleTime}>
            {trans("global.setDeadline", "设置截止日期")}
          </span>
          <Select
            style={{ width: 180, borderRadius: "5px", marginRight: "2%" }}
            onChange={this.selectSemester}
            // key={defaultSelectId}
            value={defaultSelectId}
          >
            {examSemesterList &&
            examSemesterList.length > 0 &&
            examSemesterList.length > 0
              ? examSemesterList.map((item, index) => (
                  <Option value={item.semesterId}>{item.semesterName}</Option>
                ))
              : null}
          </Select>
          <Select
            style={{ width: 120, borderRadius: "5px", marginRight: "2%" }}
            onChange={this.selectGrade}
            value={defaultStageId}
            // key={defaultStageId}
          >
            {stageList &&
              stageList.length > 0 &&
              stageList.map((item, index) => (
                <Option value={item.stageId}>{item.stageName}</Option>
              ))}
          </Select>
          <div className={styles.gradeTabs}>
            {gradeList &&
              gradeList.length > 0 &&
              gradeList.map((item, index) => (
                <div
                  className={isGradeId == item.gradeId ? styles.isChanged : ""}
                  key={item.gradeId}
                  onClick={() => this.gradeCLick(item)}
                >
                  {item.gradeName}
                </div>
              ))}
            {/* <span className={styles.isChanged}>一年级</span> */}
          </div>
          {/* <div className={styles.testPaperShow} onClick={this.testPaperModal}>
            <i className={icon.iconfont}>&#xe6b3;</i>
            <span style={{ color: "#0445fc", marginLeft: "5px" }}>
              试卷显隐
            </span>
          </div> */}
          <div className={styles.testPaperShow} onClick={this.batchModal}>
            <i
              className={icon.iconfont}
              style={{ color: "rgba(1,17,61,0.85)" }}
            >
              &#xe6b3;
            </i>
            <span style={{ color: "#0445fc", marginLeft: "5px" }}>
              {trans("global.bulkSetting", "批量设置")}
            </span>
          </div>
        </div>
        <div className={styles.tableDom}>
          <Spin spinning={this.state.loading}>
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              rowKey={"examId"}
              // scroll={{ y: 418 }}
            />
            <div className={styles.paginationDom}>
              <Pagination
                showSizeChanger
                onShowSizeChange={this.onShowSizeChange}
                onChange={this.paginChange}
                current={pageNumber}
                // defaultCurrent={3}
                showTotal={(total) =>
                  trans("ruleSettings.totalRecords", "共{$total}条记录", {
                    total,
                  })
                }
                showQuickJumper
                total={totalNum}
              />
            </div>
          </Spin>
        </div>
        {batchModalVisible ? (
          <BatchSettings
            dispatch={this.props.dispatch}
            visible={batchModalVisible}
            examSemesterList={examSemesterList}
            closeModal={this.closeModal}
          ></BatchSettings>
        ) : null}
      </div>
    );
  }
}
export default RuleSettings;
