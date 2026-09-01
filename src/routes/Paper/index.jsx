import React, { useEffect, useState } from "react";
import { Empty, message, Pagination, Spin } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";
import request from "../../utils/request";
import DownloadModal from "./components/DownloadModal";
import FilterBar from "./components/FilterBar";
import PaperCard from "./components/PaperCard";
import PaperPreview from "./components/PaperPreview";
import UploadModal from "./components/UploadModal";

import styles from "./index.module.less";
const yearOptions = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

const Paper = (properties) => {
  const { dispatch } = properties;

  const [searchParameters, setSearchParameters] = useState({
    semesterId: null,
    examTypeCode: null, //考试类型code
    gradeId: null,
    subjectId: null,
    examName: "",
    viewType: 2,
    pageNo: 1,
    limit: 10,
    year: null,
    queryZhaoShengPaper: true,
  });

  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [paperList, setPaperList] = useState([]);
  const [previewPaper, setPreviewPaper] = useState(null);
  const [paperLoading, setPaperLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [downloadPaperInfo, setDownloadPaperInfo] = useState(null);
  const [total, setTotal] = useState(0);
  const [downloadType, setDownloadType] = useState(null);

  useEffect(() => {
    dispatch({
      type: "inputQuestion/getAllGradeList",
      onSuccess: (res) => {
        if (res && res.content) {
          setGradeOptions(
            res.content.map((item) => ({
              label: item.name,
              value: item.gradeId,
            })),
          );
        }
      },
    });
    dispatch({
      type: "inputQuestion/getSubjectList",
      onSuccess: (res) => {
        if (res && res.content) {
          setSubjectOptions(
            res.content.map((item) => ({
              label: item.name,
              value: item.id,
            })),
          );
        }
      },
    });
  }, []);

  useEffect(() => {
    getPage(searchParameters);
  }, [searchParameters]);

  const handleTabChange = (value) => {
    const parameters = {
      ...searchParameters,
      viewType: value,
      pageNo: 1,
    };
    setSearchParameters(parameters);
  };

  const handleSearch = (value) => {
    const parameters = {
      ...searchParameters,
      examName: value,
      pageNo: 1,
    };
    setSearchParameters(parameters);
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleSubjectChange = (value) => {
    const parameters = {
      ...searchParameters,
      subjectId: value,
      pageNo: 1,
    };
    setSearchParameters(parameters);
  };

  const handleGradeChange = (value) => {
    const parameters = {
      ...searchParameters,
      gradeId: value,
      pageNo: 1,
    };
    setSearchParameters(parameters);
  };

  const handleYearChange = (value) => {
    const parameters = {
      ...searchParameters,
      year: value,
      pageNo: 1,
    };
    setSearchParameters(parameters);
  };

  const handlePreviewPaper = (id) => {
    setPreviewPaper({});
    setPaperLoading(true);
    dispatch({
      type: "home/getTestView",
      payload: {
        paperId: id,
      },
      onSuccess: (res) => {
        setPreviewPaper(res.content);
      },
      onError: (res) => {
        setPreviewPaper(null);
      },
      onFinally: () => {
        setPaperLoading(false);
      },
    });
  };

  const handleDeletePaper = (id) => {
    setDeleteLoading(true);
    dispatch({
      type: "home/DeleteTestList",
      payload: { paperId: id },
      onSuccess: (res) => {
        if (res && res.status) {
          setPreviewPaper(null);
          message.success(res.message);
          getPage(searchParameters);
        } else {
          message.error(res.message);
        }
      },
      onFinally: () => {
        setDeleteLoading(false);
      },
    });
  };

  const handleClosePreview = () => {
    setPreviewPaper(null);
  };

  const handleSavePaper = () => {
    setSaveLoading(true);

    // 统计题目类型数量
    const questionTypeNumberModels = [];
    // 如果试卷不支持解构服务端的格式如下
    questionTypeNumberModels.push({
      questionType: 5,
      bigQuestionNum: previewPaper.largeQuestionNumbers,
      smallQuestionNum: previewPaper.smallQuestionNumbers,
    });
    // 如果支持解构之后走下面的代码
    // if (previewPaper.moduleList && previewPaper.moduleList.length) {
    //   previewPaper.moduleList.forEach(item => {
    //     const questionNum = item.questionList && item.questionList.length ? item.questionList.length : 0;
    //     questionTypeNumberModels.push({
    //       questionType: item.moduleType,
    //       questionNum: questionNum,
    //     });
    //   });
    // }

    dispatch({
      type: "home/submitView",
      payload: {
        ...previewPaper,
        paperModuleModels: previewPaper.moduleList || [],
        questionTypeNumberModels: questionTypeNumberModels,
        zhaoShengPaper: true,
      },
      onSuccess: (res) => {
        if (res && res.status) {
          message.success(res.message);
          getPage(searchParameters);
        } else {
          message.error(res.message);
        }
      },
      onFinally: () => {
        setIsEditing(false);
        setSaveLoading(false);
      },
    });
  };

  const handleCloseUpload = () => {
    setShowUploadModal(false);
  };

  const handleUploadPaperConfirm = (data, setLoding) => {
    setLoding(true);
    const formData = assembleUploadFormData(data);

    handleUploadRequest(formData)
      .then((res) => {
        if (res.status) {
          message.success(trans("paper.upload.success", "上传成功"));
          setShowUploadModal(false);
          setSearchParameters({ ...searchParameters, pageNo: 1 });
        } else {
          message.error(res.message);
        }
      })
      .finally(() => {
        setLoding(false);
      });
  };

  const handleUploadRequest = (formData) => {
    return request("/api/word/upload_analysis_word", {
      method: "POST",
      body: formData,
    });
  };

  const getPage = (parameters) => {
    setLoading(true);
    dispatch({
      type: "home/getPaperList",
      payload: {
        ...parameters,
      },
      onSuccess: (res) => {
        setLoading(false);
        if (res && res.content) {
          setPaperList(res.content.examList || []);
          setTotal(res.content.totalNum || 0);
        }
      },
      onFinally: () => {
        setLoading(false);
      },
    });
  };

  const handleDownload = (type, paper) => {
    setDownloadType(type);
    setDownloadPaperInfo(paper);
  };

  // 根据试卷信息组装上传试卷的formData
  const assembleUploadFormData = (object) => {
    const formData = new FormData();
    const parameters = {
      files: object.files,
      examAnswerFileId: object.examAnswerFileId,
      paperName: object.paperName,
      totalScore: object.totalScore,
      gradeId: object.gradeId,
      subjectId: object.subjectId,
      year: object.year,
      mainQuestionCount: object.mainQuestionCount,
      subQuestionCount: object.subQuestionCount,
      zhaoShengPaper: true,
      paperId: object.paperId,
      type: 20,
      processMode: 1,
    };

    // 3️⃣ 统一 append（支持 0，不传 undefined / null）
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    }

    return formData;
  };

  const handleDownloadConfirm = (file, setLoding) => {
    const data = {
      ...downloadPaperInfo,
    };

    if (downloadType === "files") {
      data.files = file.originFileObj || file;
    } else if (downloadType === "examAnswerFileId") {
      data.examAnswerFileId = file.fileId;
    }

    const formData = assembleUploadFormData(data);

    setLoding(true);
    handleUploadRequest(formData)
      .then((res) => {
        if (res.status) {
          message.success(trans("paper.upload.success", "上传成功"));
          setDownloadPaperInfo(null);
          setSearchParameters({ ...searchParameters, pageNo: 1 });
        } else {
          message.error(res.message);
        }
      })
      .finally(() => {
        setLoding(false);
      });
  };

  const paperFormDataChange = (key, value) => {
    setPreviewPaper({ ...previewPaper, [key]: value });
  };

  const handleEdit = (value) => {
    setIsEditing(value);
  };

  const { gradeId, subjectId, examName, viewType, pageNo, limit, year } =
    searchParameters;

  return (
    <div className={styles.paperContainer}>
      <FilterBar
        viewType={viewType}
        subjectValue={subjectId}
        gradeValue={gradeId}
        yearValue={year}
        subjectOptions={subjectOptions}
        gradeOptions={gradeOptions}
        yearOptions={yearOptions}
        onTabChange={handleTabChange}
        onSearch={handleSearch}
        onUpload={handleUpload}
        onSubjectChange={handleSubjectChange}
        onGradeChange={handleGradeChange}
        onYearChange={handleYearChange}
      />
      <Spin spinning={loading}>
        {paperList.length > 0 ? (
          <>
            <div className={styles.paperList}>
              {paperList.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  deleteLoading={deleteLoading}
                  onPreview={handlePreviewPaper}
                  onDelete={handleDeletePaper}
                  onDownload={() => {
                    handleDownload("files", paper);
                  }}
                />
              ))}
            </div>
            <div
              style={{
                background: "#fff",
                padding: 12,
                border: "1px solid #e8e8e8",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ color: "rgba(0,0,0,0.45)" }}>
                  {trans("paper.list.total", "共")} {total}{" "}
                  {trans("paper.list.unit", "条")}
                </div>
                <Pagination
                  current={pageNo}
                  pageSize={limit}
                  total={total}
                  showSizeChanger
                  showQuickJumper
                  onChange={(page, size) =>
                    setSearchParameters({
                      ...searchParameters,
                      pageNo: page,
                      limit: size,
                    })
                  }
                  onShowSizeChange={(page, size) =>
                    setSearchParameters({
                      ...searchParameters,
                      pageNo: 1,
                      limit: size,
                    })
                  }
                />
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              background: "#fff",
              padding: 48,
              border: "1px dashed #e8e8e8",
            }}
          >
            <Empty
              description={
                loading
                  ? trans("paper.list.loading", "加载中...")
                  : trans("paper.list.empty", "暂无相关资源")
              }
            />
          </div>
        )}
      </Spin>

      {previewPaper ? (
        <PaperPreview
          saveLoading={saveLoading}
          isEditing={isEditing}
          onEdit={handleEdit}
          onFormDataChange={paperFormDataChange}
          paperLoading={paperLoading}
          paper={previewPaper || {}}
          onClose={handleClosePreview}
          onSave={handleSavePaper}
          deleteLoading={deleteLoading}
          onDelete={handleDeletePaper}
          gradeOptions={gradeOptions}
          subjectOptions={subjectOptions}
          yearOptions={yearOptions}
          onDownloadFile={(key) => {
            handleDownload(key, previewPaper);
          }}
        />
      ) : null}

      <UploadModal
        visible={showUploadModal}
        onClose={handleCloseUpload}
        // 上传成功后回调
        onConfirm={handleUploadPaperConfirm}
        onCancel={handleCloseUpload}
        gradeOptions={gradeOptions}
        subjectOptions={subjectOptions}
        yearOptions={yearOptions}
      />

      <DownloadModal
        titleText={
          downloadType === "files"
            ? trans("paper.preview.downloadQuestionnaire", "下载问卷")
            : trans("paper.preview.downloadAnswer", "下载答卷")
        }
        baseUrl={
          downloadType === "files"
            ? "/api/new_download_file"
            : "/api/preview_file"
        }
        onClose={() => setDownloadPaperInfo(null)}
        fileId={downloadPaperInfo?.paperFileId}
        fileName={downloadPaperInfo?.paperFileName}
        visible={Boolean(downloadPaperInfo)}
        onConfirm={handleDownloadConfirm}
        immediateUpload={downloadType === "files"}
      />
    </div>
  );
};

export default connect(({ home }) => ({
  home,
}))(Paper);
