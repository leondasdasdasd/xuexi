import React, { PureComponent } from "react";
import { Input, Select, Table, Tooltip } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

const { Search } = Input;
const { Option } = Select;
const { Column } = Table;

class GradeProgress extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  componentDidMount() {}
  render() {
    const { subjectBoards } = this.props;
    let newDataSource = [];
    subjectBoards &&
      subjectBoards.subjectBoardsList &&
      subjectBoards.subjectBoardsList.length > 0 &&
      subjectBoards.subjectBoardsList.map((item, index) => {
        let newObject = {
          className: item.className,
          sort: index + 1,
        };
        item.teacherNameList.length > 0 &&
          item.teacherNameList.map((it, ind) => {
            newObject[`${ind}teacherName`] = it;
          });
        newDataSource.push(newObject);
      });
    let zh = "王芊";
    let en = "Warren Joseph Paris";
    console.log(en.split(" "), "333");
    const dataSource = newDataSource;
    let newColumns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "sort",
        key: "sort",
        width: 50,
        fixed: "left",
        render: (text, record) => {
          return (
            <div>
              <div className={styles.importMessage}>{record.sort}</div>
            </div>
          );
        },
      },
      {
        title: trans("global.group", "班级"),
        dataIndex: "className",
        key: "className",
        width: 150,
        fixed: "left",
        render: (text, record) => {
          return (
            <div>
              <div className={styles.importMessage}>{text}</div>
            </div>
          );
        },
      },
    ];
    subjectBoards &&
      subjectBoards.subjectList &&
      subjectBoards.subjectList.length > 0 &&
      subjectBoards.subjectList.map((item, index) => {
        newColumns.push({
          title: (
            <div className={styles.subjectTableHeader}>
              <span>{item}</span>
              <a
                className={styles.reportLink}
                href={`${window.location.origin}${subjectBoards.subjectUrl[index]}`}
                target="_blank"
                rel="noreferrer"
              >
                {trans("global.report", "报告")}
              </a>
            </div>
          ),
          dataIndex: `${index}teacherName`,
          key: `${index}teacherName`,
          width: 160,
          render: (text, record, index) => {
            console.log(text, "212");
            return (
              <div>
                {text && text.teacherUserInfoList ? (
                  <div className={styles.teacherStatus}>
                    <div style={{ width: 72 }}>
                      {text &&
                        text.teacherUserInfoList &&
                        text.teacherUserInfoList.length > 0 &&
                        text.teacherUserInfoList.map((item) => {
                          // if (!item.userId) return;
                          let string_ = item.username;
                          if (string_.charCodeAt() <= 255) {
                            string_ = string_.split(" ");
                            string_.length > 0
                              ? (string_ = string_[0] + "...")
                              : (string_ = string_[0]);
                          }

                          return (
                            <Tooltip title={item.username}>
                              <p className={styles.teacherName}>
                                {/* {item.username} */}
                                {string_}
                              </p>
                            </Tooltip>
                          );
                        })}
                    </div>

                    {text.teacherUserInfoList.length > 0 ? (
                      <div className={styles.statusName}>
                        <span
                          className={
                            text.status == 0
                              ? styles.notFilled
                              : styles.completed
                          }
                          style={{
                            marginTop:
                              (text.teacherUserInfoList.length - 1) * 10,
                          }}
                        >
                          {text.statusName}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          },
        });
      });
    // subjectBoards &&
    //   subjectBoards.length &&
    //   subjectBoards.map((item, ind) => {
    //     let newObj = {
    //       subjectName: item.subjectName,
    //     };
    //     newObj.sort = ind + 1;
    //     newObj.subjectChiefStatus = item.subjectChiefStatus || {};
    //     newObj.teamLeaderStatus = item.teamLeaderStatus;
    //     item.classLeaderList &&
    //       item.classLeaderList.length &&
    //       item.classLeaderList.map((i) => {
    //         // i.teacherUserInfoList && i.teacherUserInfoList.length && i.teacherUserInfoList.map(item => {})
    //         newObj[`${i.classId}className`] = i;
    //       });
    //     newDataSource.push(newObj);
    //   });
    // const dataSource = newDataSource;
    subjectBoards &&
      subjectBoards.length &&
      subjectBoards.map((item, ind) => {
        let newObject = {
          subjectName: item.subjectName,
        };
        newObject.sort = ind + 1;
        newObject.subjectChiefStatus = "学科首席";
        newObject.teamLeaderStatus = "备课组长";
        // item.classLeaderList &&
        //   item.classLeaderList.length &&
        //   item.classLeaderList.map((i) => {
        //     // i.teacherUserInfoList && i.teacherUserInfoList.length && i.teacherUserInfoList.map(item => {})
        //     newObj[`${i.classId}className`] = i;
        //   });
        newDataSource.push(newObject);
      });
    // let newColumns = [
    //   {
    //     title: trans("global.order", "序号"),
    //     dataIndex: "sort",
    //     key: "sort",
    //     width: 60,
    //     fixed: "left",
    //     render: (text, record) => {
    //       return (
    //         <div>
    //           <div className={styles.importMessage}>{record.sort}</div>
    //         </div>
    //       );
    //     },
    //   },
    //   {
    //     title: trans("global.subject", "学科"),
    //     dataIndex: "subjectName",
    //     key: "subjectName",
    //     width: 110,
    //     fixed: "left",
    //     render: (text, record) => {
    //       return (
    //         <div>
    //           <div className={styles.importMessage}>{record.subjectName}</div>
    //         </div>
    //       );
    //     },
    //   },
    //   {
    //     title: trans("global.disciplineChief", "学科首席"),
    //     dataIndex: "subjectChiefStatus",
    //     key: "subjectChiefStatus",
    //     width: 200,
    //     render: (text, record) => {
    //       return (
    //         <div>
    //           {text ? (
    //             <div className={styles.teacherStatus}>
    //               {text &&
    //                 text.teacherUserInfoList &&
    //                 text.teacherUserInfoList.length &&
    //                 text.teacherUserInfoList.map((item) => (
    //                   <span className={styles.teacherName}>
    //                     {item.username}
    //                   </span>
    //                 ))}
    //               <span
    //                 className={
    //                   text.status == 0 ? styles.notFilled : styles.completed
    //                 }
    //               >
    //                 {text.statusName}
    //               </span>
    //             </div>
    //           ) : null}
    //         </div>
    //       );
    //     },
    //   },
    //   {
    //     title: trans("global.prepareLessons", "备课组长"),
    //     dataIndex: "teamLeaderStatus",
    //     key: "teamLeaderStatus",
    //     width: 200,
    //     render: (text, record) => {
    //       return (
    //         <div>
    //           <div className={styles.teacherStatus}>
    //             {text &&
    //               text.teacherUserInfoList &&
    //               text.teacherUserInfoList.length &&
    //               text.teacherUserInfoList.map((item) => (
    //                 <span className={styles.teacherName}>{item.username}</span>
    //               ))}
    //             <span
    //               className={
    //                 text.status == 0 ? styles.notFilled : styles.completed
    //               }
    //             >
    //               {text.statusName}
    //             </span>
    //           </div>
    //         </div>
    //       );
    //     },
    //   },
    // ];
    // subjectBoards &&
    //   subjectBoards.length > 0 &&
    //   subjectBoards[0].classListList &&
    //   subjectBoards[0].classListList.length > 0 &&
    //   subjectBoards[0].classListList.map((item, ind) => {
    //     newColumns.push({
    //       title: item.className,
    //       dataIndex: `${item.classId}className`,
    //       key: `${item.classId}className`,
    //       width: 200,
    //       render: (text, record, index) => {
    //         console.log(text, "212");
    //         return (
    //           <div>
    //             {text ? (
    //               <div className={styles.teacherStatus}>
    //                 {text &&
    //                   text.teacherUserInfoList &&
    //                   text.teacherUserInfoList.length &&
    //                   text.teacherUserInfoList.map((item) => (
    //                     <span className={styles.teacherName}>
    //                       {item.username}
    //                     </span>
    //                   ))}
    //                 <span
    //                   className={
    //                     text.status == 0 ? styles.notFilled : styles.completed
    //                   }
    //                 >
    //                   {text.statusName}
    //                 </span>
    //               </div>
    //             ) : null}
    //           </div>
    //         );
    //       },
    //     });
    //   });
    newColumns.push({
      title: "",
    });

    const columns = newColumns;
    return (
      <div className={styles.tableLIst} id={this.props.id}>
        <div
          className={[styles.tableBox, styles.customAnalysis].join(" ")}
          style={{ padding: "12px 0 0px", margin: 0 }}
        >
          <div
            className={styles.tableBoxHeader}
            style={{ height: 40, lineHeight: "40px" }}
          >
            <span
              className={styles.tableHeaderSpan}
              style={{ lineHeight: "40px" }}
            ></span>
            <span
              className={styles.tableHeaderTitle}
              style={{ lineHeight: "40px" }}
            >
              {this.props.titleName}
            </span>
            <div className={styles.operationS}>
              {/* {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <span className={styles.nameSwith2}>
                  {trans("global.specifyAnalysis", "指定分析")}
                  <Switch
                    defaultChecked
                    checked={this.state.newDimensionAnalysisSpecify}
                    onChange={this.courseDetailSpecifyChange}
                    style={{ marginLeft: "4px" }}
                  />
                </span>
              ) : null} */}

              {/* <a href={url} target="_blank">
                <span className={styles.exportS}>
                  {trans("global.export", "导出")}
                </span>
              </a> */}
            </div>
          </div>
          <div className={[styles.tableKanBan].join(" ")}>
            <Table
              dataSource={dataSource}
              pagination={false}
              bordered={true}
              scroll={{ x: 800 }}
              columns={columns}
            />
          </div>
        </div>
      </div>
    );
  }
}
export default connect(({ home }) => ({}))(GradeProgress);
