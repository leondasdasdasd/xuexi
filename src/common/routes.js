import { createElement } from "react";
import dynamic from "dva/dynamic";
import { Redirect } from "dva/router";

import { createExplicitExamRoutes } from "./explicitExamRoutes";
import {
  createV2QuestionListRoute,
  V2_QUESTION_LIST_ROUTE,
} from "./v2QuestionListRoute";

const routerDataCache = {
  value: undefined,
};

const modelLoaders = import.meta.glob("../models/*.js");

const modelNotExisted = (app, model) =>
  !app._models.some(({ namespace }) => {
    return namespace === model.slice(Math.max(0, model.lastIndexOf("/") + 1));
  });

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => {
  return dynamic({
    app,
    models: (event) => {
      void event;

      return models
        .filter((model) => modelNotExisted(app, model))
        .map((model) => {
          const loadModel = modelLoaders[`../models/${model}.js`];
          if (!loadModel) {
            return Promise.reject(new Error(`Model not found: ${model}`));
          }
          return loadModel();
        });
    },
    component: (event) => {
      void event;

      // add routerData prop
      if (!routerDataCache.value) {
        routerDataCache.value = getRouterData(app);
      }
      return component().then((raw) => {
        const Component = raw.default || raw;
        const RouteComponent = (properties) =>
          createElement(Component, {
            ...properties,
            routerData: routerDataCache.value,
          });
        RouteComponent.displayName =
          Component.displayName || Component.name || "DynamicRouteComponent";
        return RouteComponent;
      });
    },
  });
};

const redirectToV2QuestionList = () =>
  createElement(Redirect, { to: V2_QUESTION_LIST_ROUTE.path });

export const getRouterData = (app) => {
  // const routerConfig = {
  return [
    {
      path: "/",
      component: dynamicWrapper(
        app,
        ["home", "global"],
        () => import("../layouts/BasicLayout"),
      ),
    },
    {
      path: "/adaptive-learning",
      name: "adaptiveLearning",
      exact: false,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [],
        () => import("../adaptiveLearning/AdaptiveLearningRoot"),
      ),
    },
    {
      path: "/home",
      name: "home",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures"],
        () => import("../routes/Home"),
      ),
    },
    {
      path: "/pupllPreview/:examId/:stuId?",
      name: "pupllPreview",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/PreviewStu"),
      ),
    },
    {
      path: "/myTest",
      name: "myTest",
      mainPage: true,
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "publishToStudent"],
        () => import("../routes/MyTest"),
      ),
    },
    {
      path: "/pyoDideDemo",
      name: "pyoDideDemo",
      mainPage: true,
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "publishToStudent"],
        () => import("../routes/PyoDide"),
      ),
    },
    {
      path: "/zhixueScoreImport",
      name: "zhixueScoreImport",
      component: dynamicWrapper(
        app,
        ["global"],
        () => import("../routes/ZhixueScoreImport"),
      ),
    },
    // {
    //   path: "/examAnalysis",
    //   name: "examAnalysis",
    //   mainPage: true,
    //   isHidden: true,
    //   component: dynamicWrapper(
    //     app,
    //     [
    //       "home",
    //       "studyPictures",
    //       "global",
    //       "publishToStudent",
    //       "revisedRecord",
    //     ],
    //     () => import("../routes/ExamAnalysis")
    //   ),
    // },
    {
      path: "/examAnalysis/:id?/:tab?",
      name: "examAnalysis",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "marking",
          "machine",
        ],
        () => import("../routes/ExamAnalysis"),
      ),
    },
    {
      path: "/homeWork",
      name: "homeWork",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
        ],
        () => import("../routes/HomeWorkNew"),
      ),
    },
    {
      path: "/markingTask",
      name: "markingTask",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "marking",
        ],
        () => import("../routes/MarkingTask"),
      ),
    },
    {
      path: "/gradingPapers/:examId/:questionIds/:questionPaperType/:studentId?",
      name: "gradingPapers",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "marking",
        ],
        () => import("../routes/GradingPapers"),
      ),
    },
    {
      path: "/myMarking/:examId/:questionIds/:questionPaperType",
      name: "myMarking",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "marking",
        ],
        () => import("../routes/myMarking"),
      ),
    },
    {
      path: "/newScoreSummary",
      name: "newScoreSummary",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "studentLearning",
        ],
        () => import("../routes/NewScoreSummary"),
      ),
    },
    {
      // 参数说明：
      // id: Number 或 'null' 汇总报告id  id为null页面规则为为系统生成的汇总报告编辑页面 id不为null时页面规则为手动创建的汇总报告进行编辑  id不存在时为新增页面
      // gradeId: Number  年级id
      // reportType: Number 类型
      // semesterId: Number 学期id
      path: "/newScoreSummary/add/:id?/:gradeId?/:reportType?/:semesterId?",
      name: "newScoreSummary",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "publishToStudent"],
        () => import("../routes/NewScoreSummary/add"),
      ),
    },
    {
      path: "/learningAnalysis",
      name: "LearningAnalysis",
      mainPage: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/LearningAnalysis"),
      ),
    },
    {
      path: "/mobile/learningAnalysis/:id?",
      name: "LearningAnalysisMobile",
      mainPage: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/LearningAnalysisMobile"),
      ),
    },
    {
      path: "/basicSetting",
      name: "basicSetting",
      mainPage: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/BasicSetting"),
      ),
    },
    {
      // tabsKey: String  页面标签
      path: "/aiAssessment",
      name: "NewScoreAnalysisTable",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        ["home", "aiAssessment", "global", "exam"],
        () => import("../routes/AiAssessment"),
      ),
    },

    {
      // tabsKey: String  页面标签
      path: "/newScoreSummary/analysisSummary/:tabsKey",
      name: "NewScoreSummaryAnalysis",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "publishToStudent", "exam"],
        () => import("../routes/NewScoreSummary/analysisSummary"),
      ),
    },
    {
      path: "/sign/:id/:version",
      name: "testMouse",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "inputQuestion",
        ],
        () => import("../routes/TestMouse"),
      ),
    },
    {
      path: "/testPaperManagement/question_task",
      name: "questionTask",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/QuestionTask"),
      ),
    },
    {
      path: "/examPaperOcrLlmConfig",
      name: "examPaperOcrLlmConfig",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/ExamPaperOcrLlmConfig"),
      ),
    },
    {
      path: "/testPaperManagement/:tab?",
      name: "testPaperManagement",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "marking",
          "machine",
        ],
        () => import("../routes/TestPaperManagement"),
      ),
    },
    {
      path: "/teachingPlanExamPopup/:mode?",
      name: "teachingPlanExamPopup",
      isHidden: true,
      component: dynamicWrapper(
        app,
        ["home", "global", "publishToStudent", "machine"],
        () => import("../routes/TeachingPlanExamPopup"),
      ),
    },
    {
      path: "/paper",
      name: "paper",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "inputQuestion",
          "marking",
          "machine",
        ],
        () => import("../routes/Paper"),
      ),
    },
    {
      path: "/mistakesCollection/:showBack?",
      name: "mistakesCollection",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/MistakesCollection"),
      ),
    },
    {
      path: "/wrongTable/:id/:status?",
      name: "wrongTable",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/WrongTable"),
      ),
    },
    {
      path: "/studentHomepage/:stuId?",
      name: "studentHomepage",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/StudentHomepage"),
      ),
    },
    {
      path: "/studentPageMobile/:stuId?",
      name: "studentHomepage",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/StudentPageMobile"),
      ),
    },
    {
      path: "/progressKanban",
      name: "progressKanban",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/ProgressKanban"),
      ),
    },
    {
      path: "/logList",
      name: "logList",
      mainPage: true,
      isHidden: true,
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "studentLearning",
        ],
        () => import("../routes/Journal"),
      ),
    },
    {
      path: "/singleInput/:id?",
      name: "singleInput",
      mainPage: true,
      component: dynamicWrapper(
        app,
        ["home", "global", "inputQuestion"],
        () => import("../routes/SingleQuestionNew"),
      ),
    },
    {
      path: "/questionAssetInput/:id?",
      name: "questionAssetInput",
      mainPage: true,
      component: dynamicWrapper(
        app,
        ["home", "global", "inputQuestion"],
        () => import("../routes/QuestionAssetInput"),
      ),
    },
    {
      path: "/mutipleInput/:id?",
      name: "mutipleInput",
      mainPage: true,
      component: dynamicWrapper(
        app,
        ["home", "global", "inputQuestion"],
        () => import("../routes/BatchQuestion"),
      ),
    },
    {
      // isAutoJump: 是一个Boolean，用来标记保存成功之后是否进行标记
      path: "/detail/:ifView/:ifTest/:testId/:paperId?/:individualization?/:isAutoJump?",
      name: "detail",
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "inputQuestion",
          "publishToStudent",
          "machine",
        ],
        () => import("../routes/Detail"),
      ),
    },
    {
      path: "/allocationProcess/:examId",
      name: "allocationProcess",
      component: dynamicWrapper(
        app,
        ["home", "global", "marking"],
        () => import("../components/AllocationProcess"),
      ),
    },
    {
      path: "/setQuestionBlocks/:examId",
      name: "setQuestionBlocks",
      component: dynamicWrapper(
        app,
        ["home", "global", "marking"],
        () => import("../components/SetQuestionBlocks"),
      ),
    },
    {
      path: "/correctionDetails/:examId",
      name: "correctionDetails",
      component: dynamicWrapper(
        app,
        ["home", "global", "marking"],
        () => import("../components/CorrectionDetails"),
      ),
    },
    {
      path: "/myQuestion",
      name: "myQuestion",
      mainPage: true,
      component: redirectToV2QuestionList,
    },
    createV2QuestionListRoute(
      dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/V2QuestionList"),
      ),
    ),
    {
      path: "/paperEditor",
      name: "paperEditor",
      component: dynamicWrapper(
        app,
        ["home", "inputQuestion", "publishToStudent"],
        () => import("../routes/PaperEditor"),
      ),
    },
    {
      path: "/studentTest/:examId/:id/:isSeePaper?",
      name: "studentTest",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/StuTest"),
      ),
    },
    ...createExplicitExamRoutes(app, dynamicWrapper),
    {
      path: "/teacherPreview/:examId/:ifFromTask/:id/:ifAna?",
      name: "teacherPreview",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../components/TeacherPreview"),
      ),
    },
    {
      path: "/twoWayTest/:id?",
      name: "twoWayTest",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion", "paper"],
        () => import("../routes/TwoWayTest"),
      ),
    },
    {
      path: "/testAnalysis/:testId/:active/:paperId/:isEdit/:hash?",
      name: "testAnalysis",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/TestAnalysis"),
      ),
    },
    {
      path: "/dataAnalysis/:testId/:paperId/:active/:hideTab?/:commentMode?",
      name: "dataAnalysis",
      component: dynamicWrapper(
        app,
        [
          "home",
          "global",
          "studyPictures",
          "inputQuestion",
          "publishToStudent",
          "revisedRecord",
          "exam",
        ],
        () => import("../routes/DataAnalysis"),
      ),
    },
    {
      path: "/viewChart/:testId/:paperId",
      name: "viewChart",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/ViewChart"),
      ),
    },
    {
      path: "/viewPdf/:testId/:stuId",
      name: "ViewStuPdf",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/ViewStuPdf"),
      ),
    },
    {
      path: "/revise/:testId/:tab",
      name: "revise",
      component: dynamicWrapper(
        app,
        ["home", "global", "inputQuestion", "revisedRecord"],
        () => import("../routes/Revised"),
      ),
    },
    {
      path: "/revisedPage/:tab/:isOpen/:evaluationId?/:type?/:courseId?/:semesterId?/:stuId?",
      name: "revisedPage",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "revisedRecord"],
        () => import("../routes/RevisedHome"),
      ),
    },
    {
      path: "/aboutToArrive",
      name: "aboutToArrive",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "revisedRecord"],
        () => import("../routes/RevisedHome/aboutToArrive"),
      ),
    },
    {
      path: "/stuWork/:testId/:stuId",
      name: "stuWork",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "revisedRecord", "inputQuestion"],
        () => import("../routes/StuWork"),
      ),
    },
    {
      path: "/revisedDetail/:correctionProcessId/:type",
      name: "revisedDetail",
      component: dynamicWrapper(
        app,
        ["home", "global", "revisedRecord"],
        () => import("../routes/RevisedHome/detail"),
      ),
    },
    {
      path: "/revisedAdd/:testId?",
      name: "revisedAdd",
      component: dynamicWrapper(
        app,
        ["home", "global", "revisedRecord", "inputQuestion"],
        () => import("../routes/RevisedHome/add"),
      ),
    },
    {
      path: "/viewResolution/:paperId/:questionId",
      name: "viewResolution",
      component: dynamicWrapper(
        app,
        ["home", "global", "revisedRecord"],
        () => import("../components/ViewResolution"),
      ),
    },
    {
      path: "/testStudents/:showBack?/:tab?",
      name: "testStudents",
      component: dynamicWrapper(
        app,
        ["home", "global", "revisedRecord"],
        () => import("../routes/TestStudents"),
      ),
    },
    {
      path: "/testStudents/:testId/:paperId/:active/:hideTab?",
      name: "testStudents",
      component: dynamicWrapper(
        app,
        ["home", "studyPictures", "global", "inputQuestion"],
        () => import("../routes/TestStuTab"),
      ),
    },
    {
      path: "/correctionRemark/:examId/:defaultStudentId?/:defaultQuestionBlockId?",
      name: "correctionRemark",
      component: dynamicWrapper(
        app,
        [
          "home",
          "studyPictures",
          "global",
          "publishToStudent",
          "revisedRecord",
          "marking",
        ],
        () => import("../routes/CorrectionRemark"),
      ),
    },
    {
      path: "/hidden-check",
      name: "hiddenCheck",
      isHidden: true,
      component: dynamicWrapper(app, [], () => import("../routes/HiddenCheck")),
    },
    {
      path: "/jsonInput/:id?",
      name: "jsonInput",
      mainPage: true,
      component: dynamicWrapper(
        app,
        ["home", "global", "inputQuestion"],
        () => import("../routes/JsonQuestionImport"),
      ),
    },
  ];
};
