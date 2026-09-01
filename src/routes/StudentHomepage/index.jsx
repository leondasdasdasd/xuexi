import React from "react";
import { Input, Select, Table } from "antd";
import { connect } from "dva";

import StudentTrend from "../../components/AllStudentTrend";
import { locale } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Option } = Select;
const { Search } = Input;
const { Column } = Table;

class StudentHomepage extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {};
    this.mainContent = null;
  }

  componentDidMount() {
    //发送高度
    var mainHeight = this.mainContent ? this.mainContent.offsetHeight : 0;
    window.top && window.top.postMessage(mainHeight, "*");
  }

  render() {
    return (
      <div
        className={styles.testPaper}
        ref={(node) => (this.mainContent = node)}
      >
        <StudentTrend dispatch={this.props.dispatch} />
      </div>
    );
  }
}

export default connect(({ home, global }) => ({}))(StudentHomepage);
