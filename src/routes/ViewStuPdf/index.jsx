import React, { PureComponent } from "react";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import { dingDingRead } from "../../services/global";
import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

let timer;
class ViewStuPdf extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/viewPdf/:testId/:stuId").exec(this.url);
    this.testId = JSON.parse(this.pathMatch[1]) || null;
    this.userId = JSON.parse(this.pathMatch[2]) || null;
    this.state = {
      modalVisible: false,
      groupId: null,
      viewChart: {},
      teamModalVisible: false,
      inputValue: "",
      checkStuList: ["1"],
      popVisible: false,
    };
    this.child = null;
  }
  componentDidMount() {
    let ar = window.location.search.split("&");
    let object = {
      loginForSchoolId: null,
      businessId: null,
      businessType: null,
      planId: null,
    };
    if (ar) {
      for (const key of Object.keys(object)) {
        for (const item of ar) {
          if (item && item.includes(key)) {
            let spItem = item.split("=");
            object[spItem[0]] = spItem[1];
          }
        }
      }
    }
    dingDingRead({
      ...object,
      ifRead: true,
    });

    const { dispatch } = this.props;
    this.props.dispatch({
      type: "home/getDownload",
      payload: {
        examId: this.testId,
        studentUserId: this.userId,
      },
    });
  }
  clickDownloadTemplate = () => {
    let url = `${window.location.origin}/api/paper/export/template?paperId=${this.state.downloadInquireId}`;
    window.location.href = url;
  };
  render() {
    const { downloadPdf } = this.props;
    console.log(downloadPdf, "dd");
    return downloadPdf && downloadPdf.downloadUrl ? (
      <div className={styles.pdfDiv}>
        <div className={styles.pdfHeader}>
          <div className={styles.download}>
            <a
              href={downloadPdf.downloadUrl || ""}
              target="_blank"
              download
              rel="noreferrer"
            >
              {trans("global.download")}
            </a>
          </div>
        </div>
        <div className={styles.pdfFrame}>
          <iframe
            src={`${encodeURI(`${window.location.origin}/pdf?v=1&l=${downloadPdf.url}&t=文件预览&showmenu=false`)}`}
          ></iframe>
        </div>
      </div>
    ) : (
      <div></div>
    );
  }
}

export default connect(({ home, studyPictures }) => ({
  downloadPdf: home.downloadPdf,
}))(ViewStuPdf);
