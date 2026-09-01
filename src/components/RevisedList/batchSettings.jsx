import React, { PureComponent } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Icon,
  message,
  Modal,
  Radio,
  Select,
  TimePicker,
} from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";
const { RangePicker } = DatePicker;
const { Option } = Select;
import moment from "moment";
@connect((state) => ({}))
class BatchSettings extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      hasApproval: null,
      semesterId: null, //选择学期id
      examTypeCode: null, //测验类型id
      examDateStart: "", //开始时间
      examDateEnd: "", //结束时间
      subjectIds: [], //学科
      gradeIds: [], //年级
      approvalStopDate: "",
      approvalStopTime: "",
      gradeList: [],
      subjectList: [],
      examTypeList: [],
    };
  }
  //
  closeModal = () => {
    this.props.closeModal(false);
  };
  save = () => {
    const {
      semesterId,
      examTypeCode,
      examDateStart,
      examDateEnd,
      subjectIds,
      gradeIds,
      hasApproval,
      approvalStopDate,
      approvalStopTime,
    } = this.state;
    let newTime = moment(
      [approvalStopDate, approvalStopTime].join(" "),
    ).valueOf();
    let newStartDate = moment(examDateStart).valueOf();
    let newEndDate = moment(examDateEnd).valueOf();
    if (!semesterId) {
      message.error(trans("revisedList.selectSemester", "请选择学期"));
      return;
    }
    if (!examTypeCode) {
      message.error(trans("modalTest.selectExamType", "请选择测验类型"));
      return;
    }
    if (!examDateStart || !examDateEnd) {
      message.error(
        trans("revisedList.selectExamDateRange", "请选择考试时间范围"),
      );
      return;
    }
    if (subjectIds.length === 0) {
      message.error(trans("modalTest.selectSubject", "请选择学科"));
      return;
    }
    if (gradeIds.length === 0) {
      message.error(trans("modalTest.selectGrade", "请选择年级"));
      return;
    }
    if (!hasApproval) {
      message.error(
        trans("revisedList.selectDeadlineMode", "请选择有无截止日期"),
      );
      return;
    }
    if (hasApproval == 2 && !newTime) {
      message.error(trans("revisedList.selectDeadlineDate", "请选择截止日期"));
      return;
    }
    this.props.dispatch({
      type: "home/examCorrection",
      payload: {
        semesterId,
        examTypeCode,
        examDateStart: newStartDate,
        examDateEnd: newEndDate,
        subjectIds,
        gradeIds,
        hasApproval: hasApproval == 1 ? false : hasApproval == 2 ? true : "",
        approvalStopTime: newTime,
      },
      onSuccess: () => {
        this.props.closeModal(false);
      },
    });
  };
  componentDidMount() {
    const { dispatch, examSemesterList } = this.props;
    let defaultSemesterId = examSemesterList.filter(
      (item) => item.current == true,
    );
    // console.log(defaultSemesterId);
    if (
      defaultSemesterId &&
      defaultSemesterId.length > 0 &&
      defaultSemesterId.length > 0
    ) {
      this.selectSemester(defaultSemesterId[0].semesterId);
    }
    dispatch({
      type: "home/getExamTypeUpdate",
      onSuccess: (res) => {
        // console.log(res);
        this.setState({
          examTypeList: res || [],
        });
      },
    });
  }
  //选择学期
  selectSemester = (value) => {
    const { examSemesterList } = this.props;
    let changedSemester = examSemesterList.filter(
      (item) => item.semesterId == value,
    );
    let stageList =
      changedSemester &&
      changedSemester.length > 0 &&
      changedSemester.length > 0
        ? changedSemester[0].stageList
        : [];
    const gradeList = [];
    let subjectList = [];
    // console.log(stageList);
    stageList &&
      stageList.length &&
      stageList.length > 0 &&
      stageList.map((item, index) => {
        gradeList.push(...item.gradeList);
        subjectList = item.subjectList;
      });
    // console.log(subjectList);
    this.setState({
      semesterId: value,
      gradeList,
      subjectList,
    });
  };
  //测验类型
  selectExamType = (value) => {
    this.setState({
      examTypeCode: value,
    });
  };
  //考试范围选择
  ruleTimeChange = (date, dateString) => {
    console.log(date, dateString);
    this.setState({
      examDateStart: dateString[0],
      examDateEnd: dateString[1],
    });
  };
  //考试的学科
  checkBoxSubject = (value) => {
    console.log(value);
    this.setState({
      subjectIds: value,
    });
  };
  //选择年级
  checkBoxSemester = (value) => {
    console.log(value);
    this.setState({
      gradeIds: value,
    });
  };

  //是否指定截止日期
  isSpecifyRadio = (e) => {
    // console.log(e.target.value);
    // hasApproval
    this.setState({
      hasApproval: e.target.value,
    });
  };
  //选择时间-具体日期
  dateChange = (time, timeString) => {
    console.log(time, timeString);
    this.setState({
      approvalStopDate: timeString,
    });
  };
  //选择时间-具体小时
  timeChange = (time, timeString) => {
    console.log(time, timeString);
    this.setState({
      approvalStopTime: timeString,
    });
  };

  getStageAndSubjectList = (type) => {
    const { gradeList, subjectList } = this.state;
    let list = [];
    if (type == "subject") {
      subjectList &&
        subjectList.length &&
        subjectList.length > 0 &&
        subjectList.map((item, index) => {
          list.push({
            label: `${item.subjectName}`,
            value: `${item.subjectId}`,
          });
        });
    } else {
      gradeList &&
        gradeList.length &&
        gradeList.length > 0 &&
        gradeList.map((item, index) => {
          list.push({ label: `${item.gradeName}`, value: `${item.gradeId}` });
        });
    }
    return list;
  };
  render() {
    const { visible, examSemesterList } = this.props;
    const { hasApproval, gradeList, examTypeList } = this.state;
    return (
      <Modal
        visible={visible}
        onCancel={this.closeModal}
        centered={true}
        getContainer={false}
        // centered={true}
        closable={false}
        maskClosable={false}
        destroyOnClose={true}
        // onCancel={this.publishCancel}
        width="700px"
        className={styles.batchSettings}
        title={
          <div className={styles.modalHeader}>
            <Icon type="close" onClick={this.closeModal} />
            <span style={{ marginLeft: "42%" }}>
              {trans("global.bulkSetting", "批量设置")}
            </span>
          </div>
        }
        footer={
          <div className={styles.footer}>
            <Button onClick={this.closeModal}>
              {trans("global.cancle", "取消")}
            </Button>
            <Button
              onClick={this.save}
              className={[styles.saveGeneral, styles.saveUnifiedStyle].join(
                " ",
              )}
            >
              {trans("global.save", "保存")}
            </Button>
          </div>
        }
      >
        <div className={styles.selectItem}>
          <span className={styles.leftTitle}>
            {trans("revisedList.semesterField", "选择学期")}
            <span style={{ color: "red" }}>*</span>
          </span>
          <Select
            style={{ width: 200 }}
            onChange={this.selectSemester}
            value={this.state.semesterId}
          >
            {examSemesterList &&
            examSemesterList.length > 0 &&
            examSemesterList.length > 0
              ? examSemesterList.map((item, index) => (
                  <Option value={item.semesterId}>{item.semesterName}</Option>
                ))
              : null}
          </Select>
        </div>
        <div className={styles.selectItem}>
          <span className={styles.leftTitle}>
            {trans("global.examType", "测验类型")}
            <span style={{ color: "red" }}>*</span>
          </span>
          <Select style={{ width: 150 }} onChange={this.selectExamType}>
            {examTypeList && examTypeList.length > 0 && examTypeList.length > 0
              ? examTypeList.map((item, index) => (
                  <Option value={item.examTypeCode}>{item.examTypeName}</Option>
                ))
              : null}
          </Select>
        </div>
        <div className={styles.selectItem}>
          <span className={styles.leftTitle}>
            {trans("revisedList.examDateRangeField", "考试时间范围")}
            <span style={{ color: "red" }}>*</span>
          </span>
          <RangePicker onChange={this.ruleTimeChange} />
        </div>
        <div className={styles.selectItem}>
          <span className={styles.leftTitle}>
            {trans("revisedList.examSubjectsField", "考试的学科")}
            <span style={{ color: "red" }}>*</span>
          </span>
          <div className={styles.customCheckbox}>
            <Checkbox.Group
              options={this.getStageAndSubjectList("subject")}
              // defaultValue={["2", "3"]}
              onChange={this.checkBoxSubject}
            />
          </div>
        </div>
        <div className={styles.selectItem}>
          <span className={styles.leftTitle}>
            {trans("revisedList.gradeField", "选择年级")}
            <span style={{ color: "red" }}>*</span>
          </span>
          <div className={styles.customCheckbox}>
            <Checkbox.Group
              options={this.getStageAndSubjectList("grade")}
              // defaultValue={["2", "3"]}
              onChange={this.checkBoxSemester}
            />
          </div>
        </div>
        <div className={styles.selectItem}>
          <span className={styles.leftTitle}>
            {trans("revisedList.deadlineField", "指定截止日期")}
            <span style={{ color: "red" }}>*</span>
          </span>
          <Radio.Group onChange={this.isSpecifyRadio}>
            <Radio value={1}>
              {trans("revisedList.noDeadline", "无截止日期")}
            </Radio>
            <Radio value={2}>
              {trans("ruleSettings.specificDate", "指定日期")}
            </Radio>
          </Radio.Group>
          {hasApproval == 2 ? (
            <div>
              <DatePicker onChange={this.dateChange} />
              <TimePicker onChange={this.timeChange} format="HH:mm" />
            </div>
          ) : null}
        </div>
      </Modal>
    );
  }
}
export default BatchSettings;
