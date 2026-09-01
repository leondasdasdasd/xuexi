import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Empty,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Spin,
} from "antd";

import { FormGrid, GridFormItem } from "../../../components/Custom/FormGrid";
import { trans } from "../../../utils/i18n";

import styles from "./PaperPreview.module.less";

const { Option } = Select;

/**
 *
 * @param properties
 */
function PaperPreview(properties) {
  const { dispatch } = properties;
  const {
    paper,
    onClose,
    onSave,
    onParse,
    onDownloadFile,
    onDelete,
    gradeOptions,
    subjectOptions,
    yearOptions,
    // 删除loding
    deleteLoading,
    // 试卷加载loding
    paperLoading,
    onFormDataChange,
    isEditing,
    onEdit,
    saveLoading,
  } = properties;

  const embedReference = useRef(null);
  const [checkQuestionId, setCheckQuestionId] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [isPdf, setIsPdf] = useState(true); // 默认为pdf

  // 检测文件类型的函数
  const checkFileType = async (url) => {
    if (!url) return;

    try {
      const res = await fetch(url);
      // 重要：response.url 是重定向后的最终 URL
      const finalUrl = res.url;

      if (finalUrl.includes(".pdf")) {
        setIsPdf(true);
        console.log("✅ 检测到 PDF 特征");
      } else {
        setIsPdf(false);
        console.log("🖼️ 检测到图片特征");
      }
    } catch (error) {
      console.error("检测文件类型失败:", error);
    }
  };

  // 当PDF URL变化时，重置加载状态并预先检测文件类型
  useEffect(() => {
    setEmbedLoaded(false);
    setIsPdf(true);
    // 预先检测文件类型
    if (paper?.previewUrl) {
      checkFileType(paper.previewUrl);
    }
  }, [paper?.previewUrl]);

  const handleSave = () => {
    onSave && onSave();
  };

  const formDataChange = (key, value) => {
    onFormDataChange && onFormDataChange(key, value);
  };

  const handelPdfLoad = async () => {
    setEmbedLoaded(true);
    // 再次检测以确保准确性
    if (paper?.previewUrl) {
      await checkFileType(paper.previewUrl);
    }
  };

  useEffect(() => {
    const embedElement = embedReference.current;

    if (!embedElement) return;

    embedElement.addEventListener("load", handelPdfLoad);

    return () => {
      embedElement.removeEventListener("load", handelPdfLoad);
    };
  }, [paper?.previewUrl]);

  const titleText = isEditing
    ? trans("paper.preview.editTitle", "编辑试卷信息")
    : trans("paper.preview.viewTitle", "预览试卷");

  const isUnparsed = true;
  const labelSpan = 7;
  const contentSpan = 17;

  const {
    title,
    subjectId,
    gradeId,
    year,
    totalScore,
    largeQuestionNumbers,
    smallQuestionNumbers,
  } = paper || {};

  const moduleList = paperLoading ? [] : paper.moduleList || [];

  return (
    <Modal
      visible
      footer={null}
      width="100%"
      style={{ top: 0 }}
      bodyStyle={{ padding: 0, height: "100vh" }}
      wrapClassName={styles.fullscreenModal}
      closable={false}
      maskClosable={false}
      zIndex={1000}
    >
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="link"
              icon="arrow-left"
              onClick={onClose}
              style={{ color: "#01113D", padding: "0" }}
            >
              <span className={styles.title}>{titleText}</span>
            </Button>
            {/* <div className={styles.headerTitle}>
              {isUnparsed ? <Tag color="orange">{trans('paper.preview.unparsed', '未解析')}</Tag> : null}
            </div> */}
          </div>

          <div className={styles.headerCenter}>
            <span className={styles.scoreBadge}>
              {trans("paper.preview.totalScore", "满分")}
              {totalScore}
            </span>
          </div>

          <div className={styles.headerRight}>
            {isEditing ? (
              <>
                <Button onClick={() => onEdit(false)}>
                  {trans("global.cancel", "取消")}
                </Button>
                <Button
                  type="primary"
                  onClick={handleSave}
                  loading={saveLoading}
                >
                  {trans("global.save", "保存")}
                </Button>
              </>
            ) : (
              <>
                {/* {isUnparsed && onParse ? (
                  <Button type="primary" icon="search" onClick={() => onParse(paper.id)}>
                    {trans('paper.preview.parse', '去解析')}
                  </Button>
                ) : null} */}
                {paper.permissions?.canEdit ? (
                  <Button onClick={() => onEdit(true)}>
                    {trans("global.edit", "编辑")}
                  </Button>
                ) : null}

                {paper.permissions?.canDelete ? (
                  <Popconfirm
                    title={trans(
                      "paper.preview.confirmDelete",
                      "确定要删除吗？",
                    )}
                    okText={trans("global.ok", "确认")}
                    cancelText={trans("global.cancel", "取消")}
                    onConfirm={() => {
                      if (onDelete) onDelete(paper.paperId);
                    }}
                  >
                    <Button type="danger" ghost loading={deleteLoading}>
                      {trans("global.delete", "删除")}
                    </Button>
                  </Popconfirm>
                ) : null}

                <Button onClick={() => onDownloadFile("files")}>
                  {trans("paper.preview.downloadQuestionnaire", "下载问卷")}
                </Button>

                {paper.examAnswerFileId ? (
                  <Button onClick={() => onDownloadFile("examAnswerFileId")}>
                    {trans("paper.preview.downloadAnswer", "下载答卷")}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.contentLeft}>
            {paperLoading ? (
              <div className={styles.loadingContent}>
                <Spin tip="Loading..." />
              </div>
            ) : // moduleList ? <div className={styles.testList}>
            //   <div className={styles.testName}>
            //     <div className={styles.testName}>
            //       <h2>{paper.title}</h2>
            //     </div>
            //     <div className={styles.testNameSwitch}>
            //       <span className={styles.switchTitle}>
            //         {trans("global.showAnswers", "显示答案")}
            //       </span>
            //       <Switch
            //         checked={isChecked}
            //         onChange={() => setIsChecked(!isChecked)}
            //       />
            //     </div>
            //   </div>
            //   <DetailView
            //     detailList={paper.moduleList}
            //     ifEdit={false}
            //     dropQuestionChange={() => { }}
            //     ifTeacherView={true}
            //     isChecked={isChecked}
            //     checkQuestionId={checkQuestionId}
            //     checkQuestion={setCheckQuestionId}
            //   />
            // </div> :
            paper.previewUrl ? (
              <div className={styles.pdfContent}>
                <embed
                  ref={embedReference}
                  src={`${paper.previewUrl}#toolbar=0&view=FitH`}
                  // src={`https://work.yungu.org/api/preview_file?id=9179918#toolbar=0&view=FitH`} // 重定向之前的
                  // src="https://yungu-common.oss-cn-hangzhou.aliyuncs.com/outTaskFile/1c5d50ad-1940-4a4c-b08c-dff11f8d19d8%E8%BA%AB%E4%BB%BD%E8%AF%86%E5%88%AB%E5%B9%B3%E5%8F%B0%E4%B8%8E%E7%AC%AC%E4%B8%89%E6%96%B9%E5%AF%B9%E6%8E%A5%E6%A0%87%E5%87%86%E6%96%B9%E6%A1%88_%E4%B8%AD%E9%97%B4%E5%BA%93%E6%96%B9%E5%BC%8F_V23_1.pdf/1.pdf?Expires=1767987473&OSSAccessKeyId=LTAI5t9iKWWPWmSdQufAHaXW&Signature=r1kw%2Bvjw2HCFl3TAOpz5Ur1o8ew%3D"
                  // src={`https://yungu-public.oss-cn-hangzhou.aliyuncs.com/preview/audio.png#toolbar=0&view=FitH`} //未解析的时候展示的内容地址
                  type="application/pdf"
                  className={styles.pdfEmbed}
                  style={{
                    opacity: embedLoaded && isPdf ? 1 : 0,
                    visibility: embedLoaded && isPdf ? "visible" : "hidden",
                    position: embedLoaded && isPdf ? "static" : "absolute",
                    pointerEvents: embedLoaded && isPdf ? "auto" : "none",
                  }}
                />
                {embedLoaded ? (
                  isPdf ? null : (
                    <div className={styles.fileResolving}>
                      {trans(
                        "global.fileResolving",
                        "文件正在解析中，请稍后查看",
                      )}
                    </div>
                  )
                ) : (
                  <div className={styles.loadingContent}>
                    <Spin tip="Loading..." />
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.unableTest}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={trans(
                    "analysis.unableToGetTheTestPaper",
                    "无法获取到试卷",
                  )}
                />
              </div>
            )}
          </div>

          <div className={styles.contentRight}>
            <FormGrid className={styles.form} rowGap={16}>
              <GridFormItem
                label={trans("paper.preview.paperName", "试卷名称")}
                required
                labelSpan={labelSpan}
                contentSpan={contentSpan}
              >
                <Input
                  disabled={!isEditing}
                  value={title}
                  style={{ width: "100%" }}
                  onChange={(e) => formDataChange("title", e.target.value)}
                  placeholder={trans(
                    "paper.preview.paperNamePlaceholder",
                    "请输入试卷名称",
                  )}
                />
              </GridFormItem>

              <GridFormItem
                label={trans("paper.preview.subject", "学科")}
                required
                labelSpan={labelSpan}
                contentSpan={contentSpan}
              >
                <Select
                  value={subjectId}
                  disabled={!isEditing}
                  style={{ width: "100%" }}
                  placeholder={trans(
                    "paper.preview.subjectPlaceholder",
                    "请选择学科",
                  )}
                  onChange={(value) => formDataChange("subjectId", value)}
                >
                  {(subjectOptions || []).map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </GridFormItem>
              <GridFormItem
                label={trans("paper.preview.grade", "年级")}
                required
                labelSpan={labelSpan}
                contentSpan={contentSpan}
              >
                <Select
                  disabled={!isEditing}
                  value={gradeId}
                  style={{ width: "100%" }}
                  placeholder={trans(
                    "paper.preview.gradePlaceholder",
                    "请选择年级",
                  )}
                  onChange={(value) => formDataChange("gradeId", value)}
                >
                  {(gradeOptions || []).map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </GridFormItem>
              <GridFormItem
                label={trans("paper.preview.year", "年份")}
                required
                labelSpan={labelSpan}
                contentSpan={contentSpan}
              >
                <Select
                  disabled={!isEditing}
                  value={year}
                  style={{ width: "100%" }}
                  placeholder={trans(
                    "paper.preview.yearPlaceholder",
                    "请选择年份",
                  )}
                  onChange={(value) => formDataChange("year", value)}
                >
                  {(yearOptions || []).map((opt) => (
                    <Option key={opt} value={opt}>
                      {opt}
                    </Option>
                  ))}
                </Select>
              </GridFormItem>

              <GridFormItem
                label={trans("paper.preview.totalScoreLabel", "总分")}
                labelSpan={labelSpan}
                contentSpan={contentSpan}
              >
                <InputNumber
                  disabled={!isEditing}
                  min={0}
                  style={{ width: "100%" }}
                  placeholder={trans(
                    "paper.preview.totalScorePlaceholder",
                    "请输入总分",
                  )}
                  value={totalScore}
                  onChange={(value) => formDataChange("totalScore", value)}
                />
              </GridFormItem>

              <GridFormItem
                label={trans("paper.preview.mainQuestionCount", "大题数")}
                labelSpan={labelSpan}
                contentSpan={contentSpan}
              >
                <InputNumber
                  disabled={!isEditing}
                  min={0}
                  style={{ width: "100%" }}
                  value={largeQuestionNumbers}
                  placeholder={trans(
                    "paper.preview.mainQuestionCountPlaceholder",
                    "请输入大题数",
                  )}
                  onChange={(value) =>
                    formDataChange("largeQuestionNumbers", value)
                  }
                />
              </GridFormItem>

              <GridFormItem
                label={trans("paper.preview.subQuestionCount", "小题数量")}
                labelSpan={labelSpan}
                contentSpan={contentSpan}
              >
                <InputNumber
                  disabled={!isEditing}
                  min={0}
                  style={{ width: "100%" }}
                  value={smallQuestionNumbers}
                  placeholder={trans(
                    "paper.preview.subQuestionCountPlaceholder",
                    "请输入小题数量",
                  )}
                  onChange={(value) =>
                    formDataChange("smallQuestionNumbers", value)
                  }
                />
              </GridFormItem>
            </FormGrid>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PaperPreview;
