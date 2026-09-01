import React, { PureComponent } from "react";
import { message } from "antd";
import { connect } from "dva";
import lodash from "lodash";

import Directory from "../../../../components/Directory";
import { trans } from "../../../../utils/i18n";
import ClassSelector from "./ClassSelector";
import EditableText from "./EditableText";
import InfoCard from "./InfoCard";
import ReportModule from "./ReportModule";

import styles from "./index.module.less";

class ClassReport extends PureComponent {
  constructor(properties) {
    super(properties);
    this.centerContentRef = React.createRef();

    this.state = {
      groupId: "",
      reportData: null,
      directoryList: [],
      infoList: [],
    };
  }

  componentDidUpdate(previousProperties) {
    const { viewType } = this.props;
    // console.log(prevProps, this.props, prevProps.viewType !== viewType, prevProps.viewType, viewType, 'viewType');
    if (previousProperties.viewType !== viewType) {
      this.clearComponent();
      this.initComponent();
    }
  }

  componentDidMount() {
    this.initComponent();
  }

  clearComponent = () => {
    this.setState({
      groupId: "",
      reportData: null,
      directoryList: [],
      infoList: [],
    });
  };

  initComponent = () => {
    const { viewType, examId } = this.props;
    if (viewType === 14) {
      this.props.dispatch({
        type: "home/getClassList",
        payload: {
          examId,
          visible: false,
        },
        callback: (response) => {
          if (response.status) {
            const data = response.content;
            let id = data && data.length > 0 ? data[0].groupId : 0;

            this.setState(
              {
                groupId: id,
                classList: data,
              },
              () => {
                this.getDetail({
                  examId,
                  groupId: id,
                });
              },
            );
          } else {
            message.error(response.message);
          }
        },
      });
    } else if (viewType === 15) {
      this.getDetail({ examId });
    }
  };

  reportNameChange = (e) => {
    this.setState({
      reportData: {
        ...this.state.reportData,
        reportName: e.target.value,
      },
    });
  };

  modelNameChange = (e, index) => {
    const { reportData } = this.state;
    let cloneData = lodash.cloneDeep(reportData);
    cloneData.moduleModelList[index].modelName = e.target.value;

    this.setState({
      reportData: cloneData,
    });
  };

  blurModelName = () => {
    this.saveData(this.state.reportData);
  };

  modelVisibilityChange = (checked, index) => {
    let cloneData = lodash.cloneDeep(this.state.reportData);
    cloneData.moduleModelList[index].modelShow = checked;
    this.saveData(cloneData);

    this.setState({
      reportData: cloneData,
    });
  };

  blurReportName = async () => {
    this.saveData(this.state.reportData);
  };

  // 保存
  saveData = (data, callback) => {
    this.props.dispatch({
      type: "home/postSaveStudySituationStructure",
      payload: data,
    });
  };

  selectedClass = (id) => {
    const { examId } = this.props;
    this.setState({
      groupId: id,
    });

    this.getDetail({
      examId,
      groupId: id,
    });
  };

  getDetail = (parameters) => {
    const { viewType } = this.props;
    this.props.dispatch({
      type: "home/getStudySituationByStudentId",
      payload: parameters,
      onSuccess: ({ content }) => {
        const { examTime, groupName, gradeName, teacherName, moduleModelList } =
          content;

        let list = null;
        if (viewType == 14) {
          list = [
            { name: "评测时间", value: examTime },
            { name: trans("global.group", "班级"), value: groupName },
            { name: "任教教师", value: teacherName },
          ];
        } else if (viewType == 15) {
          list = [
            { name: "评测时间", value: examTime },
            { name: "年级", value: gradeName },
            { name: "备课组长", value: teacherName },
          ];
        }

        this.setState({
          reportData: content,
          infoList: list,
          directoryList: moduleModelList.map((item) => ({
            title: item.modelName,
            targetId: item.modelCode,
          })),
        });
      },
    });
  };

  resetRemart = () => {
    const { viewType, examId } = this.props;
    const { groupId } = this.state;
    let leftPos = screen.width - 500;
    if (viewType == 14) {
      window.open(
        `${window.location.origin}/exam?groupId=${groupId}&examId=${examId}&entry_key=14#/aiAssessment`,
      );
    } else if (viewType == 15) {
      window.open(
        `${window.location.origin}/exam?examId=${examId}&entry_key=15#/aiAssessment`,
      );
    }
  };

  render() {
    const { classList, reportData, infoList } = this.state;
    return (
      <div className={styles.classReport}>
        <div
          style={{
            height: "100%",
            width: "1359px",
            display: "flex",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          {this.props.viewType == 14 ? (
            <div className={styles.leftContent}>
              <ClassSelector
                title={trans(
                  "global.selectClassToPreviewReport",
                  "选择班级预览报告",
                )}
                classList={classList}
                selectedId={this.state.groupId}
                onChange={(id) => this.selectedClass(id)}
              />
            </div>
          ) : null}

          <div className={styles.centerWarp} ref={this.centerContentRef}>
            <div className={styles.centerContent}>
              <div style={{ textAlign: "center" }}>
                <EditableText
                  underline={true}
                  onChange={this.reportNameChange}
                  onBlur={this.blurReportName}
                  value={reportData?.reportName}
                />
              </div>
              <InfoCard dataList={infoList} />

              {reportData?.moduleModelList.map((item, index) => {
                return (
                  <div id={item.modelCode} key={item.modelCode}>
                    <ReportModule
                      viewType={this.props.viewType}
                      modelData={item}
                      toggleValue={item.moduleSwitch}
                      onNameChange={(e) => {
                        this.modelNameChange(e, index);
                      }}
                      onBlurModelName={this.blurModelName}
                      onVisibilityChange={(checked) =>
                        this.modelVisibilityChange(checked, index)
                      }
                      onResetRemark={this.resetRemart}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.rightContent}>
            <div style={{ height: "100%", overflowY: "auto" }}>
              <Directory
                scrollContainer={this.centerContentRef.current}
                name={trans("global.viewList", "看板目录")}
                items={this.state.directoryList}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default connect(() => {
  return {};
})(ClassReport);
