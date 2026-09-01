import React from "react";
import { DatePicker, Input, Pagination, Select, Table } from "antd";
import { connect } from "dva";
import moment from "moment";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Option } = Select;
const { Search } = Input;
const { Column } = Table;
const { RangePicker } = DatePicker;

const dateFormat = "YYYY/MM/DD HH:mm:ss";

let date = new Date();
let month =
  date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1; //当前月
let year = date.getFullYear(); //当前年(4位)
let day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
let time = "";
time =
  month - 1 == 0
    ? year - 1 + "-" + 12 + "-" + day + " " + "00:00:00"
    : year + "-" + (month - 1) + "-" + day + " " + "00:00:00";

console.log(time, "333");
class Journal extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      modulesId: 0,
      actionsId: 0,
      examId: 0,
      pageNo: 1,
      pageSize: 50,
      startDate: time,
      dateStart: "",
      dateEnd: "",
      endDate: year + "-" + month + "-" + day + " " + "24:00:00",
      newSysLogList: {},
      selectUserId: null,
      isSelect: true,
      searchUsersList: [],
    };
  }

  componentDidMount() {
    if (this.props.currentUser) {
      this.getPage();
      this.getUSer();
    }
    this.props.dispatch({
      type: "home/getExam",
      payload: {
        pageNo: 1,
        campusOrMy: 0,
        examName: "",
        examTypeCode: "",
        gradeId: "",
        semesterId: "",
        subjectId: "",
        limit: 10_000,
        userId: "",
      },
    });
  }
  getUSer = () => {
    this.props.dispatch({
      type: "home/getLogUser",
      payload: {
        startDate: this.state.startDate,
        endDate: this.state.endDate,
        page: 1,
        pageSize: 10,
      },
    });
  };
  getPage = () => {
    this.props
      .dispatch({
        type: "home/getSysLog",
        payload: {
          examId: this.state.examId == 0 ? "" : this.state.examId,
          userId: this.state.isSelect
            ? this.state.selectUserId
            : this.state.userId,
          type: this.state.actionsId == 0 ? "" : this.state.actionsId,
          startDate: this.state.startDate,
          endDate: this.state.endDate,
          page: this.state.pageNo,
          pageSize: this.state.pageSize,
        },
      })
      .then(() => {
        this.setState({
          newSysLogList: this.props.sysLogList,
        });
      });
  };

  onShowSizeChange = (current, pageSize) => {
    this.setState(
      {
        pageNo: 1,
        pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };

  changeNo = (value, pageSize) => {
    this.setState(
      {
        pageNo: value,
      },
      () => {
        this.getPage();
      },
    );
  };
  changeStartDate = (date, dateString) => {
    console.log(date, dateString);
    this.setState({
      dateStart: dateString,
    });
  };
  changeEndDate = (date, dateString) => {
    console.log(date, dateString);
    this.setState({
      dateEnd: dateString,
    });
  };
  onChangeRangePickerStart = (date, dateString) => {
    console.log(date._i, dateString, "222");
    this.setState(
      {
        startDate: this.state.dateStart,
        selectUserId: null,
        isSelect: false,
      },
      () => {
        this.getUSer();
        this.getPage();
      },
    );
  };

  onChangeRangePickerEnd = (date) => {
    console.log(date, "222");
    this.setState(
      {
        endDate: this.state.dateEnd,
        selectUserId: null,
        isSelect: false,
      },
      () => {
        this.getUSer();
        this.getPage();
      },
    );
  };

  changeExam = (e) => {
    this.setState(
      {
        examId: e,
      },
      () => {
        this.getPage();
      },
    );
  };

  onSearchUsers = (e) => {
    const { newSysLogList } = this.state;
    // if (e) {
    //   let arr = [];
    //   newSysLogList &&
    //     newSysLogList.data &&
    //     newSysLogList.data.length > 0 &&
    //     newSysLogList.data.map((item) => {
    //       if (item.userName.indexOf(e) != -1) {
    //         arr.push(item);
    //       }
    //     });
    //   console.log(arr, "222");
    //   this.setState({
    //     newSysLogList: {
    //       data: arr,
    //       total: newSysLogList.total,
    //       pageNum: newSysLogList.pageNum,
    //       pageSize: newSysLogList.pageSize,
    //     },
    //   });
    // } else {
    //   this.setState({
    //     newSysLogList: this.props.sysLogList,
    //   });
    // }
    this.props.dispatch({
      type: "home/getSelectAllTutor",
      payload: {
        name: e,
      },
    });
  };

  changeSearch = (e) => {
    console.log(e, "222");
    this.setState(
      {
        userId: e,
        isSelect: false,
      },
      () => {
        this.getPage();
      },
    );
  };
  changeSelect = (e) => {
    console.log(e, "222");
    this.setState(
      {
        selectUserId: e,
        isSelect: true,
      },
      () => {
        this.getPage();
      },
    );
  };
  clickUser = (user) => {
    let userId = "";
    if (
      this.state.newSysLogList &&
      this.state.newSysLogList.data &&
      this.state.newSysLogList.data.length > 0
    ) {
      this.state.newSysLogList.data.map((item) => {
        if (item.userName === user) {
          userId = JSON.stringify(item.userId);
        }
      });
    }
    this.props
      .dispatch({
        type: "home/getSelectAllTutor",
        payload: {
          name: user,
        },
      })
      .then(() => {
        this.setState(
          {
            userId,
          },
          () => {
            this.getPage();
          },
        );
      });
  };
  changeAction = (e) => {
    this.setState(
      {
        actionsId: e,
      },
      () => {
        this.getPage();
      },
    );
  };

  render() {
    const {
      modulesId,
      actionsId,
      examId,
      pageNo,
      pageSize,
      startDate,
      endDate,
      newSysLogList,
      searchUsersList,
    } = this.state;
    const { sysLogList, examList, selectAllTutorList, logUser } = this.props;
    let newColumns = [
      {
        title: trans("global.time", "时间"),
        dataIndex: "createTime",
        key: "createTime",
        width: 180,
        // fixed: "left",
      },
      {
        title: trans("global.testName", "测验名称"),
        dataIndex: "examName",
        key: "examName",
        width: 290,
      },
      {
        title: trans("global.modular", "模块"),
        dataIndex: "moduleName",
        key: "moduleName",
        width: 100,
      },
      {
        title: trans("global.user", "用户"),
        dataIndex: "userName",
        key: "userName",
        width: 170,
        render: (text) => {
          console.log(text);
          return (
            <div
              className={styles.userName}
              onClick={this.clickUser.bind(this, text)}
            >
              {text}
            </div>
          );
        },
      },
      {
        title: trans("global.operationAction", "操作动作"),
        dataIndex: "type",
        key: "type",
        width: 100,
        // render: (text, record) => {
        //   return (
        //     <div>
        //       <div className={styles.importMessage}>{text}</div>
        //     </div>
        //   );
        // },
      },
      {
        title: trans("global.pedagogicalOperation", "操作描述"),
        dataIndex: "description",
        key: "description",
        width: 150,
        // render: (text, record) => {
        //   return (
        //     <div>
        //       <div className={styles.importMessage}>{text}</div>
        //     </div>
        //   );
        // },
      },

      {
        title: trans("global.accessInterface", "访问接口"),
        dataIndex: "requestUrl",
        key: "requestUrl",
        // width: 300,
        // render: (text, record) => {
        //   return (
        //     <div>
        //       <div className={styles.importMessage}>{text}</div>
        //     </div>
        //   );
        // },
      },
    ];
    // console.log(this.props.examList, "212");
    let columns = newColumns;
    return (
      <div className={styles.journalBox}>
        <div className={styles.searchBar}>
          <span className={[styles.inline, styles.selectDate].join(" ")}>
            {/* <span>{trans("global.selectDate", "选择日期")}：</span> */}
            <span>{trans("global.startDate", "开始日期：")}</span>
            <DatePicker
              showTime
              placeholder={trans("journal.selectTime", "选择时间")}
              onChange={this.changeStartDate}
              defaultValue={moment(startDate, dateFormat)}
              onOk={this.onChangeRangePickerStart}
              // onOk={onOk}
            />
            <span style={{ marginLeft: "12px" }}>
              {trans("global.endDate", "结束日期：")}
            </span>
            <DatePicker
              showTime
              placeholder={trans("journal.selectTime", "选择时间")}
              defaultValue={moment(endDate, dateFormat)}
              onChange={this.changeEndDate}
              onOk={this.onChangeRangePickerEnd}
              // onOk={onOk}
            />
            {/* <RangePicker
              onChange={this.onChangeRangePicker}
              defaultValue={[
                moment(startDate, dateFormat),
                moment(endDate, dateFormat),
              ]}
              format={dateFormat}
            /> */}
          </span>
          <span
            className={[styles.inline, styles.semesterSelect1].join(" ")}
            data-type="全部模块"
            id="allModules"
          >
            <Select
              // onChange={this.changeStage}
              value={modulesId}
              style={{ width: 120 }}
              // open="true"
              getPopupContainer={() => document.querySelector(`#allModules`)}
            >
              <Option value={0} key={0}>
                {trans("global.allModules", "全部模块")}
              </Option>
              {/* {examOptions && examOptions.length
                ? examOptions.map((item) => (
                    <Option value={item.semesterId} key={item.semesterId}>
                      <span title={item.semesterName}>{item.semesterName}</span>
                    </Option>
                  ))
                : null} */}
            </Select>
          </span>
          <span
            className={[styles.inline].join(" ")}
            data-type="全部动作"
            id="allActions"
          >
            <Select
              onChange={this.changeAction}
              value={actionsId}
              style={{ width: 108 }}
              // open="true"
              getPopupContainer={() => document.querySelector(`#allActions`)}
            >
              <Option value={0} key={0}>
                {trans("global.allActions", "全部动作")}
              </Option>
              <Option value={"select"} key={1}>
                {trans("global.select", "查询")}
              </Option>
              <Option value={"update"} key={2}>
                {trans("global.replace", "更新")}
              </Option>
              <Option value={"export"} key={3}>
                {trans("global.export", "导出")}
              </Option>
              {/* {examOptions && examOptions.length
                ? examOptions.map((item) => (
                    <Option value={item.semesterId} key={item.semesterId}>
                      <span title={item.semesterName}>{item.semesterName}</span>
                    </Option>
                  ))
                : null} */}
            </Select>
          </span>
          <span
            className={[styles.inline, styles.semesterSelect1].join(" ")}
            data-type="全部测验"
            id="allExam"
          >
            <Select
              onChange={this.changeExam}
              value={examId}
              style={{ width: 120 }}
              // open="true"
              getPopupContainer={() => document.querySelector(`#allExam`)}
            >
              <Option value={0} key={0}>
                {trans("global.allExam", "全部测验")}
              </Option>
              {examList && examList.examList && examList.examList.length > 0
                ? examList.examList.map((item) => (
                    <Option value={item.examId} key={item.examId}>
                      <span title={item.examName}>{item.examName}</span>
                    </Option>
                  ))
                : null}
            </Select>
          </span>
          <span className={styles.inline} data-type="搜索">
            <Select
              placeholder={trans("global.searchUsers", "搜索用户")}
              allowClear
              value={this.state.userId}
              onChange={this.changeSearch}
              onSearch={this.onSearchUsers}
              style={{ width: 160 }}
              showSearch
              defaultActiveFirstOption={false}
              showArrow={false}
              filterOption={false}
              notFoundContent={null}
              // suffixIcon={<Icon type="search" />}
            >
              {selectAllTutorList &&
                selectAllTutorList.length > 0 &&
                selectAllTutorList.map((item) => (
                  <Option key={item.userId}>{item.name}</Option>
                ))}
            </Select>
          </span>
          <span className={styles.inline} data-type="搜索">
            <Select
              placeholder={trans("create.teacherSelect", "搜索用户")}
              allowClear
              value={this.state.selectUserId}
              onChange={this.changeSelect}
              // onSearch={this.onSearchUsers}
              style={{ width: 200 }}
              // showSearch
              defaultActiveFirstOption={false}
              showArrow={false}
              // filterOption={false}
              // notFoundContent={null}
              // suffixIcon={<Icon type="search" />}
            >
              {logUser &&
                logUser.length > 0 &&
                logUser.map((item) => (
                  <Option key={item.userId} label={item.name}>
                    {item.name}
                  </Option>
                ))}
            </Select>
          </span>
        </div>
        <div className={styles.tableBox}>
          <Table
            dataSource={newSysLogList.data}
            pagination={false}
            scroll={{ x: 800, y: window.innerHeight - 130 }}
            columns={columns}
          />
          <Pagination
            size="small"
            current={pageNo}
            pageSize={pageSize}
            pageSizeOptions={[50, 100, 150, 200]}
            total={newSysLogList.total || 0}
            onChange={this.changeNo}
            showSizeChanger
            showQuickJumper
            onShowSizeChange={this.onShowSizeChange}
          />
        </div>
      </div>
    );
  }
}

export default connect(({ home, global }) => ({
  currentUser: global.currentUser,
  sysLogList: home.sysLogList,
  examList: home.examList,
  selectAllTutorList: home.selectAllTutorList,
  logUser: home.logUser,
}))(Journal);
