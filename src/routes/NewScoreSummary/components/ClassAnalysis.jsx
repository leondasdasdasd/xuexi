import React, { useEffect, useRef, useState } from "react";

import Directory from "../../../components/Directory";
import { locale, trans } from "../../../utils/i18n";
import ClassScoreSegmentTable from "./ClassScoreSegmentTable";
import ClassTotalScoreTable from "./ClassTotalScoreTable";
const ClassAnalysis = (properties) => {
  const classAnalysisContentReference = useRef(null);
  const [classRateTableData, setClassRateTableData] = useState([]);
  const [classSummaryTableData, setClassSummaryTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columns1, setColumns1] = useState([]);

  const { clickEditSegment, exportFail, classRateData, classSummaryData } =
    properties;

  useEffect(() => {
    if (classRateData && classRateData.length > 0) {
      let headerData1 = classRateData.splice(0, 1);
      let columns = getClassRateColumns(headerData1[0]);
      setColumns(columns);

      let coayData = JSON.parse(JSON.stringify(classRateData));
      for (const item of coayData) {
        if (item.classRateScoreSectionDetails)
          for (const item1 of item.classRateScoreSectionDetails) {
            item[item1.stageText] = item1.studentCount;
          }
      }
      setClassRateTableData(
        coayData.map((item) => ({ ...item, key: item.classId })),
      );
    }
  }, [classRateData]);

  useEffect(() => {
    if (classSummaryData && classSummaryData.length > 0) {
      let headerData = classSummaryData.splice(0, 1);
      let columns = getClassSummaryColumns(headerData[0]);
      setColumns1(columns);

      let coayData = JSON.parse(JSON.stringify(classSummaryData));
      for (const item of coayData) {
        item.classSummarySubjects.map((element) => {
          item[element.subjectId] = element.subjectTotalScore;
        });
      }

      setClassSummaryTableData(
        coayData.map((item) => ({ ...item, key: item.classId })),
      );
    }
  }, [classSummaryData]);

  const getClassRateColumns = (object) => {
    let array = [
      {
        title: trans("global.group", "班级"),
        key: "className",
        sorter: (a, b) => a.classId - b.classId,
        sortDirections: ["descend", "ascend"],
        defaultSortOrder: "ascend",
        align: "center",
        children: [
          {
            title: object?.className,
            dataIndex: "className",
            align: "center",
          },
        ],
      },
      {
        title: `${trans("global.zongfen", "总分")}（${object?.paperSubjectTotalScore}）`,
        key: "studentTotal",
        sorter: (a, b) => a.studentTotal - b.studentTotal,
        sortDirections: ["descend", "ascend"],
        align: "center",
        children: [
          {
            title: object?.studentTotal,
            dataIndex: "studentTotal",
            align: "center",
          },
        ],
      },
      {
        title: `${trans("global.excellentRate", "优秀率")}（≥${object?.excellentScore}）`,
        key: "excellentRate",
        sorter: (a, b) =>
          a.excellentRate.split("%")[0] - b.excellentRate.split("%")[0],
        sortDirections: ["descend", "ascend"],
        align: "center",
        children: [
          {
            title: object?.excellentRate,
            dataIndex: "excellentRate",
            align: "center",
            render: (text, record) => {
              return <span>{text}</span>;
            },
          },
        ],
      },
      {
        title: `${trans("global.goodRate", "良好率")}（≥${object?.goodScore}）`,
        key: "goodRate",
        sorter: (a, b) => a.goodRate.split("%")[0] - b.goodRate.split("%")[0],
        sortDirections: ["descend", "ascend"],
        align: "center",
        children: [
          {
            title: object?.goodRate,
            dataIndex: "goodRate",
            align: "center",
            render: (text, record) => {
              return <span>{text}</span>;
            },
          },
        ],
      },
      {
        title: `${trans("global.passRating", "及格率")}（≥${object?.passScore}）`,
        key: "passRate",
        sorter: (a, b) => a.passRate.split("%")[0] - b.passRate.split("%")[0],
        sortDirections: ["descend", "ascend"],
        align: "center",
        children: [
          {
            title: object?.passRate,
            dataIndex: "passRate",
            align: "center",
            render: (text, record) => {
              return <span>{text}</span>;
            },
          },
        ],
      },
    ];
    let array1 = object?.classRateScoreSectionDetails?.map((item) => {
      return {
        title: item.stageText,
        key: item.stageText,
        sorter: (a, b) =>
          a.beforeGrade?.split("%")[0] - b.beforeGrade?.split("%")[0],
        sortDirections: ["descend", "ascend"],
        align: "center",
        children: [
          {
            title: item.studentCount,
            dataIndex: item.stageText,
            align: "center",
          },
        ],
      };
    });
    return [...array, ...(array1 || [])];
  };

  const getClassSummaryColumns = (object) => {
    let classSummaryColumns = [
      {
        title: trans("global.group", "班级"),
        key: "className",
        sorter: (a, b) => a.classId - b.classId,
        sortDirections: ["descend", "ascend"],
        align: "center",
        defaultSortOrder: "ascend",
        children: [
          {
            align: "center",
            dataIndex: "className",
            title: object?.className,
          },
        ],
      },
      {
        title: trans("global.takingAllSubjects", "全科实考人数"),
        key: "studentTotal",
        align: "center",
        children: [
          {
            title: `${trans("global.gong", "共")}${object?.studentTotal}`,
            dataIndex: "studentTotal",
            align: "center",
          },
        ],
      },
      {
        title: `${trans("global.zongfen", "总分")}（${object?.paperSubjectTotalScore}）`,
        key: "studentTotalScore",
        sorter: (a, b) => a.studentTotalScore - b.studentTotalScore,
        sortDirections: ["descend", "ascend"],
        align: "center",
        children: [
          {
            title: object?.studentTotalScore,
            align: "center",
            dataIndex: "studentTotalScore",
          },
        ],
      },
    ];

    if (object?.classSummarySubjects)
      for (const item of object?.classSummarySubjects) {
        if (item) {
          classSummaryColumns.push({
            title: `${item.subjectName}（${item.paperSubjectTotalScore}）`,
            key: item.subjectId,
            sorter: (a, b) => a[item.subjectId] - b[item.subjectId],
            sortDirections: ["descend", "ascend"],
            align: "center",
            children: [
              {
                title: object[item.subjectId],
                dataIndex: item.subjectId,
                align: "center",
              },
            ],
          });
        }
      }

    return classSummaryColumns;
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
        ref={classAnalysisContentReference}
        style={{
          marginRight: "10px",
          height: "100%",
          width: "calc(100% - 160px)",
          overflow: "auto",
        }}
      >
        <ClassTotalScoreTable
          exportFail={exportFail}
          tableData={classSummaryTableData}
          columns={columns1}
        />

        <ClassScoreSegmentTable
          exportFail={exportFail}
          tableData={classRateTableData}
          columns={columns}
          clickEditSegment={clickEditSegment}
        />
      </div>

      <div style={{ width: "150px", height: "100%", overflowY: "auto" }}>
        <Directory
          scrollContainer={classAnalysisContentReference.current}
          name={trans("global.viewList", "看板目录")}
          items={[
            {
              title: trans("global.classRank", "班级总分榜"),
              targetId: "classRank",
            },
            {
              title:
                locale() == "en"
                  ? "Class Score Rates&Segment Count"
                  : "班级总分三率对比和各分段人数",
              targetId: "classScoreRates",
            },
          ]}
        />
      </div>
    </div>
  );
};
export default ClassAnalysis;
