import React, { useEffect, useRef, useState } from "react";

import Directory from "../../../components/Directory";
import { locale, trans } from "../../../utils/i18n";
import FailingStudentsTable from "./FailingStudentsTable";
import FailSubjectsTable from "./FailSubjectsTable";
const FailedAnalysis = (properties) => {
  const failedAnalysisContentReference = useRef(null);
  const [dataSourceFlunk, setDataSourceFlunk] = useState([]);
  const [failedExamResultResponses, setFailedExamResultResponses] = useState(
    [],
  );
  const [remark, setRemark] = useState("");
  const [columns, setColumns] = useState([]);

  const { exportFail, viewGroupChange, viewGroup, failedAnalysisData } =
    properties;

  useEffect(() => {
    if (failedAnalysisData) {
      const {
        studentExamResultSummaryAnalyseRowList,
        columnSet,
        failedExamResultResponses,
      } = failedAnalysisData;
      // 不及格学生明细
      let list = [];
      if (studentExamResultSummaryAnalyseRowList?.length) {
        studentExamResultSummaryAnalyseRowList.map((item, index) => {
          let newObject = {
            studentNo: item.studentNo,
            studentName: item.studentName,
            groupName: item.groupName,
            flankSubjectNum: item.flankSubjectNum,
            groupId: item.groupId,
            key: item.studentNo,
            index: index + 1,
          };
          if (item.examResultSummaryAnalyseRow?.length) {
            item.examResultSummaryAnalyseRow.map((index) => {
              if (columnSet && columnSet.length > 0) {
                columnSet.map((it) => {
                  if (it.subjectId === index.subjectId) {
                    newObject[`${it.subjectId}Score`] = index.score;
                    newObject[`${it.subjectId}scoreRatePass`] =
                      index.scoreRatePass;
                  }
                });
              }
            });
          }
          list.push(newObject);
        });
      }

      let list1 = failedExamResultResponses.map((item, index) => ({
        ...item,
        key: item.failedExamCount,
        index: index + 1,
      }));

      setRemark(failedAnalysisData.studentExamResultSummaryTotal || "");

      setDataSourceFlunk(list);

      setFailedExamResultResponses(list1);

      setColumns(getFailingStudentsColumns(failedAnalysisData));
    }
  }, [failedAnalysisData]);

  const getFailingStudentsColumns = (object) => {
    // 不及格学生明细
    let newFlunkListByStudent = [
      {
        title: trans("global.order", "序号"),
        align: "center",
        children: [
          {
            align: "center",
            dataIndex: "index",
          },
        ],
      },
      {
        title: trans("global.studentNumber", "学号"),
        key: "studentNo",
        align: "center",
        children: [
          {
            align: "center",
            dataIndex: "studentNo",
          },
        ],
      },
      {
        title: trans("global.student", "学生"),
        key: "studentName",
        align: "center",
        children: [
          {
            align: "center",
            dataIndex: "studentName",
          },
        ],
      },
      {
        title: trans("global.group", "班级"),
        key: "groupName",
        sorter: (a, b) => a.groupId - b.groupId,
        sortDirections: ["descend", "ascend"],
        align: "center",
        children: [
          {
            align: "center",
            dataIndex: "groupName",
          },
        ],
      },
      {
        title: trans("global.failedSubjectsCount1", "不及格学科数"),
        key: "flankSubjectNum",
        sorter: (a, b) => a.flankSubjectNum - b.flankSubjectNum,
        sortDirections: ["descend", "ascend"],
        defaultSortOrder: "descend",
        align: "center",
        children: [
          {
            align: "center",
            dataIndex: "flankSubjectNum",
          },
        ],
      },
    ];

    if (object.columnSet?.length) {
      object.columnSet.map((item, index) => {
        let failCount = object?.failSubjectList?.find(
          (ele) => ele.subjectId == item.subjectId,
        )?.failCount;
        newFlunkListByStudent.push({
          title: `${item.subjectName}${item.totalScore}`,
          key: `${item.subjectId}Score`,
          sorter: (a, b) =>
            a[`${item.subjectId}Score`] - b[`${item.subjectId}Score`],
          sortDirections: ["descend", "ascend"],
          align: "center",
          render: (text, record, index) => {
            return (
              <div>
                <span
                  className={[
                    styles.importMessage,
                    record[`${item.subjectId}scoreRatePass`]
                      ? ""
                      : styles.noPass,
                  ].join(" ")}
                >
                  {record[`${item.subjectId}Score`]}
                </span>
              </div>
            );
          },
          children: [
            {
              align: "center",
              dataIndex: `${item.subjectId}Score`,
              title: failCount
                ? `${trans("global.gong", "共")} ${failCount} ${locale() == "en" ? "Students" : "人"}`
                : null,
            },
          ],
        });
      });
    }
    return newFlunkListByStudent;
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      <div
        ref={failedAnalysisContentReference}
        style={{
          marginRight: "10px",
          height: "100%",
          width: "calc(100% - 160px)",
          overflow: "auto",
        }}
      >
        <FailSubjectsTable
          tableData={failedExamResultResponses}
          exportFail={exportFail}
          viewGroupChange={viewGroupChange}
          viewGroup={viewGroup}
        />

        <FailingStudentsTable
          remark={remark}
          exportFail={exportFail}
          tableData={dataSourceFlunk}
          columns={columns}
        />
      </div>
      <div style={{ width: "150px", height: "100%", overflowY: "auto" }}>
        <Directory
          // 内容区域的滚动容器
          scrollContainer={failedAnalysisContentReference.current}
          name={trans("global.viewList", "看板目录")}
          // 内容区域的各个部分
          items={[
            {
              title: trans("global.failedSubjectsCount1", "不及格学科数"),
              targetId: "failedSubjectsCount1", //锚点的id
            },
            {
              title: trans("global.detailsFailedStudents", "不及格学生明细"),
              targetId: "detailsFailedStudents",
            },
          ]}
        />
      </div>
    </div>
  );
};
export default FailedAnalysis;
