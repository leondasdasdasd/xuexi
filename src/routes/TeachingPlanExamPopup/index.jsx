import React from "react";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import ModalOnlineTest from "components/ModalOnlineTest";

import ImportPaperUploadModal from "../../components/ImportPaperUploadModal";
import { trans } from "../../utils/i18n";
import { getPageQuery } from "../../utils/utils";

const hasQueryValue = (value) =>
  value !== undefined && value !== null && value !== "";

const normalizeQueryValue = (value) => {
  const currentValue = Array.isArray(value) ? value[0] : value;
  if (!hasQueryValue(currentValue)) {
    return;
  }
  const text = String(currentValue);
  return /^-?\d+$/.test(text) ? Number(text) : currentValue;
};

const getDefaultExamName = (context = {}) =>
  context.examName ||
  (context.lessonTitle ? `${context.lessonTitle}测验` : undefined);

class TeachingPlanExamPopup extends React.Component {
  constructor(properties) {
    super(properties);
    this.mode = this.getMode(properties);
    this.state = {
      defaultSemester: {},
      importVisible: this.mode === "import",
      onlineVisible: this.mode !== "import",
    };
  }

  getMode = (properties = this.props) => {
    const pathMatch = pathToRegexp("/teachingPlanExamPopup/:mode?").exec(
      properties.location.pathname,
    );
    return pathMatch && pathMatch[1] ? pathMatch[1] : "select";
  };

  componentDidMount() {
    this.applyTransparentHost();
    this.notifyHostReady();
    const context = this.getContext();
    this.props
      .dispatch({
        type: "home/getOptions",
      })
      .then(() => {
        const { examOptions } = this.props;
        const currentSemester =
          (examOptions || []).find((item) =>
            hasQueryValue(context.semesterId)
              ? String(item.semesterId) === String(context.semesterId)
              : false,
          ) ||
          (examOptions || []).find((item) => item.current === true) ||
          (examOptions || [])[0] ||
          {};
        this.setState({
          defaultSemester: currentSemester,
        });
      });

    this.props.dispatch({
      type: "home/getAllTestSubject",
      payload: hasQueryValue(context.gradeId)
        ? { gradeId: context.gradeId }
        : undefined,
    });
  }

  componentWillUnmount() {
    this.restoreTransparentHost();
  }

  applyTransparentHost = () => {
    if (typeof document === "undefined") {
      return;
    }
    this.previousBodyBackground = document.body.style.background;
    this.previousHtmlBackground = document.documentElement.style.background;
    const root = document.querySelector("#root");
    this.previousRootBackground = root ? root.style.background : undefined;

    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
    if (root) {
      root.style.background = "transparent";
    }
  };

  restoreTransparentHost = () => {
    if (typeof document === "undefined") {
      return;
    }
    document.body.style.background = this.previousBodyBackground || "";
    document.documentElement.style.background =
      this.previousHtmlBackground || "";
    const root = document.querySelector("#root");
    if (root) {
      root.style.background = this.previousRootBackground || "";
    }
  };

  notifyHostReady = () => {
    if (!window.parent || window.parent === window) {
      return;
    }
    const postReady = () => {
      window.parent.postMessage(
        {
          type: "YG_TEACHING_PLAN_EXAM_POPUP_READY",
        },
        "*",
      );
    };
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(postReady);
      });
      return;
    }
    setTimeout(postReady, 0);
  };

  componentDidUpdate(previousProperties) {
    const previousMode = this.getMode(previousProperties);
    const currentMode = this.getMode();

    if (previousMode !== currentMode) {
      this.setState({
        importVisible: currentMode === "import",
        onlineVisible: currentMode !== "import",
      });
    }
  }

  getContext = () => {
    const query = getPageQuery() || {};
    return {
      source: query.source,
      courseId: normalizeQueryValue(query.courseId),
      lessonId: normalizeQueryValue(query.lessonId),
      unitId: normalizeQueryValue(query.unitId),
      semesterId: normalizeQueryValue(query.semesterId),
      subjectId: normalizeQueryValue(query.subjectId),
      gradeId: normalizeQueryValue(query.gradeId),
      lessonTitle: Array.isArray(query.lessonTitle)
        ? query.lessonTitle[0]
        : query.lessonTitle,
      examName: Array.isArray(query.examName)
        ? query.examName[0]
        : query.examName,
    };
  };

  closePopup = (payload = {}) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "YG_TEACHING_PLAN_EXAM_POPUP_CLOSE",
          payload,
        },
        "*",
      );
    }
    this.setState({
      importVisible: false,
      onlineVisible: false,
    });
  };

  render() {
    const context = this.getContext();
    const defaultExamName = getDefaultExamName(context);
    const { defaultSemester, importVisible, onlineVisible } = this.state;
    const { testSubject } = this.props;

    return (
      <>
        {onlineVisible ? (
          <ModalOnlineTest
            modalOnlineTestProps={{
              options: {
                visible: onlineVisible,
                width: 700,
                title: trans("global.editTestSettings", "编辑测验设置"),
                onOk: (payload = {}) =>
                  this.closePopup({
                    action: "onlineTestConfirm",
                    ...payload,
                  }),
                onCancel: () => this.closePopup({ action: "onlineTestCancel" }),
              },
              dispatch: this.props.dispatch,
              paperId: "",
              source: context.source,
              defaultSubjectId: context.subjectId,
              defaultCourseId: context.courseId,
              defaultUnitId: context.unitId,
              defaultLessonId: context.lessonId,
              defaultSemesterId: context.semesterId,
              defaultGradeId: context.gradeId,
              defaultLessonTitle: context.lessonTitle,
              defaultExamName,
            }}
          />
        ) : null}

        {importVisible ? (
          <ImportPaperUploadModal
            visible={importVisible}
            title={trans("global.importTest", "导入试卷")}
            onCancel={() => this.closePopup({ action: "importCancel" })}
            onConfirm={(createdPaper) =>
              this.closePopup({ action: "importConfirm", createdPaper })
            }
            gradeOptions={defaultSemester.gradeList || []}
            subjectOptions={testSubject || []}
            paperTypeOptions={defaultSemester.examType || []}
            defaultGradeId={context.gradeId}
            defaultPaperName={defaultExamName}
            defaultTermId={context.semesterId}
            defaultSubjectId={context.subjectId}
          />
        ) : null}
      </>
    );
  }
}

export default connect(({ home }) => ({
  examOptions: home.examOptions,
  testSubject: home.testSubject,
}))(TeachingPlanExamPopup);
