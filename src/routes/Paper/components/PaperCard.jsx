import React, { useEffect, useState } from "react";
import { Button, Card, Icon, Popconfirm, Tag } from "antd";

import { trans } from "../../../utils/i18n";

import styles from "./PaperCard.module.less";

/**
 *
 * @param properties
 */
function PaperCard(properties) {
  const { paper, onPreview, onDelete, onParse, onDownload, deleteLoading } =
    properties;
  const [visible, setVisible] = useState(false);
  // const genMethod = paper && paper.genMethod;
  // const isLocalImport = genMethod === 'LOCAL_IMPORT' || genMethod === 'local_import';
  // const canParse = isLocalImport && !paper.isParsed;

  // const genMethodText = isLocalImport
  //   ? trans('paper.card.genMethod.local', '本地导入')
  //   : trans('paper.card.genMethod.assembly', '组卷');

  // const parsedText = paper.isParsed
  //   ? trans('paper.card.parsed', '已解析')
  //   : trans('paper.card.unparsed', '未解析');

  useEffect(() => {
    if (!deleteLoading && visible) {
      setVisible(false);
    }
  }, [deleteLoading]);

  return (
    <Card
      className={styles.card}
      bodyStyle={{ padding: "6px 16px" }}
      bordered={false}
    >
      <div className={styles.row}>
        <div className={styles.main}>
          <div className={styles.titleRow}>
            <div className={styles.title} title={paper.name}>
              {paper.title}
            </div>
          </div>

          <div className={styles.metaRow}>
            <Tag color="geekblue">
              {trans("paper.card.localImport", "本地导入")}
            </Tag>
            {/* {isLocalImport ? (
              <Tag color={paper.isParsed ? 'green' : 'default'}>{parsedText}</Tag>
            ) : null} */}

            <span className={styles.metaItem}>
              <Icon type="calendar" />
              <span className={styles.metaText}>{paper.createDate || "-"}</span>
            </span>
            <span className={styles.metaItem}>
              <Icon type="book" />
              <span className={styles.metaText}>
                {paper.subjectName || "-"}
              </span>
            </span>
            <span className={styles.metaItem}>
              <Icon type="team" />
              <span className={styles.metaText}>{paper.gradeName || "-"}</span>
            </span>
            <span className={styles.metaItem}>
              <Icon type="user" />
              <span className={styles.metaText}>
                {paper.createUserName || "-"}
              </span>
            </span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              {trans("global.manfen", "满分")}
            </span>
            <span className={styles.statValue}>{paper.totalScore || "--"}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              {" "}
              {trans("evaluation.majorTopic", "大题")}
            </span>
            <span className={styles.statValue}>
              {paper.largeQuestionNumbers || "--"}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              {" "}
              {trans("evaluation.smallQuestion", "小题")}
            </span>
            <span className={styles.statValue}>
              {paper.smallQuestionNumbers || "--"}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          {/* {canParse ? (
            <Button type="link" onClick={() => onParse(paper.id)}>
              {trans('paper.card.parse', '解析')}
            </Button>
          ) : null} */}

          <Button type="link" onClick={() => onPreview(paper.id)}>
            {trans("paper.card.preview", "预览")}
          </Button>

          <Button
            type="link"
            onClick={() => {
              onDownload && onDownload(paper);
            }}
          >
            {trans("paper.card.download", "下载")}
          </Button>

          {/* <Button type="link" onClick={() => window.open(`/api/new_download_file?id=${paper.paperFileId}`)}>
            {trans('paper.card.download', '下载')}
          </Button> */}

          <Popconfirm
            visible={visible}
            title={trans(
              "global.areYouSureToDeleteTheCurrentTestPaper",
              "确定删除当前试卷?",
            )}
            okText={trans("global.ok", "确认")}
            cancelText={trans("global.cancel", "取消")}
            onConfirm={() => onDelete(paper.id)}
            onCancel={() => setVisible(false)}
            placement="left"
            okButtonProps={{
              loading: deleteLoading,
            }}
          >
            <Button
              type="link"
              onClick={() => setVisible(true)}
              disabled={paper.permissions?.canDelete === false}
            >
              {trans("global.delete", "删除")}
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Card>
  );
}

export default PaperCard;
