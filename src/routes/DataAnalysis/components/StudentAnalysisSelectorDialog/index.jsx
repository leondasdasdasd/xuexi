import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "antd";

import { locale, trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

const StudentAnalysisSelectorDialog = ({
  isOpen,
  onClose,
  onConfirm,
  examId,
  dispatch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [excludedStudentsMap, setExcludedStudentsMap] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [examResultList, setExamResultList] = useState([]);
  const [serverLoaded, setServerLoaded] = useState(false);
  const [serverLoaded1, setServerLoaded1] = useState(false);
  const [loading, setLoading] = useState(false);

  const BRAND_COLOR = "#0445FC";
  const TEXT_STRONG = "#01113D";
  const TEXT_SECONDARY = "#5A6481";
  const BORDER_COLOR = "#E6E7EC";
  const HEADER_BG = "#F7F8F9";
  const LINK_COLOR = "#032E92";
  const SEPARATOR_COLOR = "#F2F3F5";

  useEffect(() => {
    setServerLoaded(false);
    setServerLoaded1(false);
    if (isOpen && examId) {
      fetchFilterStudentList();
      fetchCorrection();
    }
  }, [isOpen, examId]);

  // 根据已经勾选的学生，将未勾选的学生添加到excludedStudentsMap中
  useEffect(() => {
    if (
      selectedStudents &&
      examResultList &&
      serverLoaded &&
      serverLoaded1 &&
      selectedStudents.length > 0 &&
      examResultList.length > 0
    ) {
      const object = {};
      for (const item of examResultList) {
        if (!selectedStudents.includes(item.id)) {
          object[item.id] = {
            id: item.id,
            name: item.name,
            EnName: item.EnName,
            className: item.className,
            classNameEn: item.classNameEn,
            score: item.score,
          };
        }
      }
      setExcludedStudentsMap(object || {});
    }
  }, [selectedStudents, examResultList]);

  const fetchCorrection = () => {
    dispatch({
      type: "home/postCorrection",
      payload: {
        examId: examId,
        groupId: 0,
        isSort: true,
        limit: 1000,
        pageNo: 1,
        scoreCorrectionType: 0,
        searchStudentKeyWord: "",
      },
      onSuccess: (response) => {
        setServerLoaded(true);
        const content = response.content || {};
        const examResultList = content.examResultList || [];

        let newArray = [];
        for (const [index, item] of examResultList.entries()) {
          if (index === 0) continue;
          newArray.push({
            id: item.studentUserId * 1,
            name: item.studentName || "",
            EnName: item.studentEnName || "",
            className: item.groupName || "",
            classNameEn: item.groupEnName || "",
            score: item.studentScore || 0,
          });
        }

        newArray.sort((a, b) => a.score - b.score);
        setExamResultList(newArray || []);
      },
      onFinally: () => {
        console.log("finally");
      },
    });
  };

  const fetchFilterStudentList = () => {
    dispatch({
      type: "home/getFilterStudentList",
      payload: {
        examId: examId,
      },
      onSuccess: (response) => {
        setServerLoaded1(true);
        let array = (response.content || []).map((item) => item.studentId * 1);
        setSelectedStudents(array || []);
      },
      onFinally: () => {
        console.log("finally");
      },
    });
  };

  const filteredStudents = useMemo(() => {
    return examResultList
      .filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          (locale() === "en" ? s.EnName : s.name).toLowerCase().includes(q) ||
          (locale() === "en" ? s.classNameEn : s.className)
            .toLowerCase()
            .includes(q) ||
          s.score.toString().includes(q)
        );
      })
      .sort((a, b) => a.score - b.score);
  }, [searchQuery, examResultList]);

  const toggleStudent = (item) => {
    let next = { ...excludedStudentsMap };
    if (next[item.id]) delete next[item.id];
    else next[item.id] = item;
    setExcludedStudentsMap(next || {});
  };

  const handleReset = () => {
    setExcludedStudentsMap({});
  };

  const handleConfirm = () => {
    // 传递所有参与分析的学生(已经勾选的学生)
    const selectedStudentList = examResultList.filter(
      (item) => !excludedStudentsMap[item.id],
    );
    onConfirm(selectedStudentList, {
      start: () => {
        setLoading(true);
      },
      end: () => {
        setLoading(false);
      },
    });
  };

  const selectedCount = useMemo(() => {
    // 如果当前已经排除的学生存在于examResultList中，则不参与计算
    const excludedStudents = Object.keys(excludedStudentsMap).map(
      (key) => excludedStudentsMap[key],
    );
    const excludedStudentsIds = new Set(
      excludedStudents.map((item) => item.id),
    );
    return examResultList.filter((item) => !excludedStudentsIds.has(item.id))
      .length;
  }, [examResultList, excludedStudentsMap]);

  if (!isOpen) return null;

  return (
    <div className={styles.mask}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header} style={{ borderColor: BORDER_COLOR }}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Icon
                type="usergroup-add"
                style={{ fontSize: 20, color: "#0045fc" }}
              />
            </div>
            <div>
              <div style={{ color: TEXT_STRONG, fontSize: "16px" }}>
                {trans("dataAnalysis.selector.title", "指定分析范围")}
              </div>
              {/* <div style={{ color: TEXT_SECONDARY }}>
                                {trans('dataAnalysis.selector.subtitle', '选中学生将参与数据分析')}
                            </div> */}
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <Icon type="close" />
          </button>
        </div>

        <div className={styles.body}>
          {/* 左侧 */}
          <div className={styles.left} style={{ borderColor: BORDER_COLOR }}>
            <div
              className={styles.search}
              style={{ borderColor: SEPARATOR_COLOR }}
            >
              <input
                placeholder={trans(
                  "dataAnalysis.selector.searchPlaceholder",
                  "搜索姓名、班级或得分...",
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={`${styles.list} ${styles.customScrollbar}`}>
              <div className={styles.grid}>
                {filteredStudents.map((student, index) => {
                  // 没有被剔除的学生为true，被剔除的学生为false
                  const isExcluded = !!excludedStudentsMap[student.id];
                  const isLeftColumn = index % 2 === 0;
                  return (
                    <div
                      key={student.id}
                      className={`${styles.item} ${isExcluded ? styles.excluded : ""} ${isLeftColumn ? styles.leftColumn : ""}`}
                      onClick={() => toggleStudent(student)}
                    >
                      {/* 序号：01 02 03 */}
                      <div className={styles.sort}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className={styles.itemLeft}>
                        <div
                          className={styles.checkbox}
                          style={{
                            background: isExcluded
                              ? "transparent"
                              : BRAND_COLOR,
                            borderColor: isExcluded ? "#D1D5DB" : BRAND_COLOR,
                          }}
                        >
                          {!isExcluded && (
                            <Icon
                              type="check"
                              style={{ margin: 0, fontSize: 9, color: "#fff" }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            color: TEXT_STRONG,
                            fontWeight: "500",
                          }}
                        >
                          {locale() === "en" ? student.EnName : student.name}
                        </span>
                        <em
                          style={{
                            fontSize: "12px",
                            color: "#737E93",
                            fontWeight: "400",
                          }}
                        >
                          {locale() === "en"
                            ? student.classNameEn
                            : student.className}
                        </em>
                      </div>
                      <strong
                        style={{
                          color: isExcluded ? "#94a3b8" : BRAND_COLOR,
                          fontSize: "13px",
                          fontWeight: "500",
                          marginLeft: "auto",
                          background: "#EFF2FE",
                          padding: "2px 8px",
                          borderRadius: "3px",
                        }}
                      >
                        {student.score}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右侧 */}
          <div className={styles.right}>
            <div
              className={styles.rightHeader}
              style={{ background: HEADER_BG, borderColor: BORDER_COLOR }}
            >
              <Icon
                type="delete"
                style={{ fontSize: 15, color: TEXT_STRONG }}
              />
              <span
                style={{
                  color: TEXT_STRONG,
                  fontSize: "14px",
                  fontWeight: "700",
                }}
              >
                {trans("dataAnalysis.selector.excludedStudents", "已剔除学生")}{" "}
                ({Object.keys(excludedStudentsMap).length})
              </span>
            </div>

            <div className={`${styles.rightContent} ${styles.customScrollbar}`}>
              {Object.keys(excludedStudentsMap).length === 0 ? (
                <div className={styles.empty}>
                  <Icon type="info-circle" />
                  <p>
                    {trans(
                      "dataAnalysis.selector.emptyMessage",
                      "当前包含全量实考学生",
                    )}
                  </p>
                </div>
              ) : (
                <div className={styles.tags}>
                  {Object.keys(excludedStudentsMap).map((key) => (
                    <div
                      key={key}
                      className={styles.tag}
                      onClick={() => toggleStudent(excludedStudentsMap[key])}
                    >
                      {locale() === "en"
                        ? excludedStudentsMap[key].EnName
                        : excludedStudentsMap[key].name}
                      <Icon
                        type="close"
                        style={{ margin: 0, fontSize: 9, color: "#94a3b8" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className={styles.footer}
              style={{ borderColor: BORDER_COLOR }}
            >
              <div className={styles.footerTop}>
                <div>
                  <div>
                    {trans("dataAnalysis.selector.sampleLabel", "参与分析样本")}
                  </div>
                  <div className={styles.count}>
                    <span style={{ color: BRAND_COLOR }}>{selectedCount}</span>
                    <em>/ {examResultList.length}</em>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  style={{ color: LINK_COLOR }}
                  className={styles.resetBtn}
                >
                  <Icon type="reload" />
                  {trans("dataAnalysis.selector.resetAll", "全部恢复")}
                </button>
              </div>

              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={onClose}>
                  {trans("global.cancel", "取消")}
                </button>
                <button
                  className={styles.confirmBtn}
                  style={{ background: BRAND_COLOR }}
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading && (
                    <Icon type="loading" style={{ marginRight: "8px" }} />
                  )}
                  {trans(
                    "dataAnalysis.selector.confirmAndReturn",
                    "确认分析并返回报告",
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalysisSelectorDialog;
