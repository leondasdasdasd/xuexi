import { useEffect, useMemo, useState } from "react";

import { getTeacherExamStudents } from "../../../services/explicitExam";
import { locale, trans } from "../../../utils/i18n";
import { mapTeacherExamStudentDirectoryToView } from "../mappers";
import type { StudentFilterView } from "../types";

import styles from "./StudentResultSwitcher.module.less";

type Properties = {
  examId: number;
  onSelect: (studentId: number) => void;
  selectedStudent: StudentFilterView;
};

const StudentResultSwitcher = ({
  examId,
  onSelect,
  selectedStudent,
}: Properties) => {
  const [groupId, setGroupId] = useState<number>();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [groups, setGroups] = useState<StudentFilterView[]>([]);
  const [students, setStudents] = useState<StudentFilterView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const allClassLabel = trans("global.allClass", "全部班级");
  const searchStudentLabel = trans("global.searchStu", "搜索学生");
  const switchStudentLabel = trans("global.switchStudents", "切换学生");

  useEffect(() => {
    const normalizedKeyword = keywordInput.trim();
    if (normalizedKeyword === keyword) return;
    const timer = window.setTimeout(() => {
      setStudents([]);
      setPageNo(1);
      setKeyword(normalizedKeyword);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword, keywordInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void getTeacherExamStudents(examId, {
      groupId,
      keyword,
      limit: 20,
      pageNo,
    })
      .then((directory) => {
        if (!active) return;
        const view = mapTeacherExamStudentDirectoryToView(directory, locale());
        setGroups(view.groups);
        setStudents((current) =>
          pageNo === 1 ? view.students : [...current, ...view.students],
        );
        setTotal(view.total);
        return null;
      })
      .catch(() => {
        if (active)
          setError(
            trans(
              "explicitExam.studentDirectoryLoadFailed",
              "学生列表加载失败",
            ),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [examId, groupId, keyword, pageNo]);

  const options = useMemo(() => {
    if (students.some((student) => student.id === selectedStudent.id))
      return students;
    return [selectedStudent, ...students];
  }, [selectedStudent, students]);

  return (
    <div className={styles["student-switcher"]}>
      <label>
        <select
          aria-label={allClassLabel}
          value={groupId || ""}
          onChange={(event) => {
            setStudents([]);
            setPageNo(1);
            setGroupId(
              event.target.value ? Number(event.target.value) : undefined,
            );
          }}
        >
          <option value="">{allClassLabel}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          aria-label={searchStudentLabel}
          placeholder={searchStudentLabel}
          type="search"
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
        />
      </label>
      <label>
        <select
          aria-label={switchStudentLabel}
          value={selectedStudent.id}
          onChange={(event) => onSelect(Number(event.target.value))}
        >
          {options.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </label>
      {students.length < total ? (
        <button
          disabled={loading}
          type="button"
          onClick={() => setPageNo((current) => current + 1)}
        >
          {trans("explicitExam.loadMoreStudents", "加载更多学生")}
        </button>
      ) : null}
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
};

export default StudentResultSwitcher;
