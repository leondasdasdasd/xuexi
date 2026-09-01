import React, { useCallback, useState } from "react";
import { message, Popover, Spin, TreeSelect } from "antd";

import {
  queryChapter,
  queryLabel,
  queryTree,
} from "../../../services/inputQuestion";
import { trans } from "../../../utils/i18n";
import { loginRedirect } from "../../../utils/utils";

const { SHOW_PARENT } = TreeSelect;

/** 按学科+年级缓存，全页共享，避免重复请求 */
const metaTreeCache = {
  knowledge: Object.create(null),
  chapter: Object.create(null),
  indicator: Object.create(null),
};

const metaTreeCacheKey = (subjectId, gradeId) => `${subjectId}_${gradeId}`;

/**
 *
 * @param cls
 */
function openMetaTreeSelect(cls) {
  const parentDom = document.getElementsByClassName(cls);
  if (parentDom && parentDom[0]) {
    setTimeout(() => {
      parentDom[0].querySelectorAll(".ant-select-selection")[0]?.click();
    }, 150);
  }
}

/**
 *
 * @param raw
 */
function transformIndicatorTree(raw) {
  if (!raw || raw.length === 0) return [];
  const newTree1 = JSON.parse(JSON.stringify(raw));
  const handeData = (list) => {
    if (list && list.length > 0) {
      for (const threeItem of list) {
        threeItem.value = `${threeItem.name}-${threeItem.pinyin || ""}-${threeItem.id}`;
        threeItem.title = `${threeItem.name}`;
        if (threeItem.indicatorSon && threeItem.indicatorSon.length > 0) {
          handeData(threeItem.indicatorSon);
        }
      }
    }
  };
  handeData(newTree1);
  return newTree1;
}

const META_ROWS = [
  {
    metaKey: "knowledge",
    titleKey: "singleInput.knowledgeTree",
    titleDefault: "知识点",
    classPrefix: "knowledge",
  },
  {
    metaKey: "chapter",
    titleKey: "global.chapter",
    titleDefault: "章节",
    classPrefix: "chapter",
  },
  {
    metaKey: "indicator",
    titleKey: "singleInput.label",
    titleDefault: "素养",
    classPrefix: "indicator",
  },
];

/**
 *
 * @param item
 * @param metaKey
 * @param sonIndex
 */
function getDisplayValues(item, metaKey, sonIndex) {
  if (sonIndex != undefined) {
    const sub = item.sonQuestionList && item.sonQuestionList[sonIndex];
    if (!sub) return [];
    if (metaKey === "knowledge") return sub.knowledgeValues || [];
    if (metaKey === "chapter") return sub.chapterValues || [];
    if (metaKey === "indicator") return sub.indicatorValues || [];
    return [];
  }
  if (metaKey === "knowledge") return item.knowledgeValues || [];
  if (metaKey === "chapter") return item.chapterValues || [];
  if (metaKey === "indicator") return item.indicatorValues || [];
  return [];
}

/**
 *
 * @param root0
 * @param root0.styles
 * @param root0.metaKey
 * @param root0.classPrefix
 * @param root0.item
 * @param root0.sonIndex
 * @param root0.treeData
 * @param root0.loading
 * @param root0.onQuestionBind
 * @param root0.onLabelChange
 * @param root0.listIndex
 * @param root0.getPopupContainer
 */
function BindRow({
  styles,
  metaKey,
  classPrefix,
  item,
  sonIndex,
  treeData,
  loading,
  onQuestionBind,
  onLabelChange,
  listIndex,
  getPopupContainer,
}) {
  const overlayClass = `${classPrefix}${item.id}${sonIndex == undefined ? "" : `_sub_${sonIndex}`}`;
  const values = getDisplayValues(item, metaKey, sonIndex);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: sonIndex == undefined ? 4 : 8,
      }}
    >
      <span
        className={styles.chapterSort}
        style={{
          lineHeight: "26px",
          minWidth: sonIndex == undefined ? 36 : 44,
        }}
      >
        {sonIndex == undefined
          ? trans("global.entireQuestion", "整题")
          : `(${sonIndex + 1}).`}
      </span>
      <Popover
        getPopupContainer={getPopupContainer}
        trigger="click"
        overlayClassName={overlayClass}
        placement="right"
        content={
          <div>
            <Spin spinning={loading}>
              <TreeSelect
                treeCheckable
                showSearch
                treeData={treeData || []}
                value={values}
                style={{ minWidth: "200px" }}
                dropdownStyle={{ maxHeight: "35vh", overflow: "auto" }}
                placeholder="Please select"
                treeDefaultExpandAll
                onChange={(value) =>
                  onLabelChange(value, metaKey, listIndex, sonIndex)
                }
                getPopupContainer={getPopupContainer}
                showCheckedStrategy={SHOW_PARENT}
                treeNodeFilterProp="title"
              />
            </Spin>
          </div>
        }
      >
        <div
          style={{
            height: "20px",
            width: "20px",
            position: "relative",
            marginRight: "12px",
          }}
        >
          <i
            className={styles.iconfont}
            style={{
              color: "#0445FC",
              fontSize: "20px",
              cursor: "pointer",
              position: "absolute",
              left: "0",
              top: "-5px",
            }}
            onClick={() => onQuestionBind(item, metaKey, sonIndex)}
          >
            &#xe867;
          </i>
        </div>
      </Popover>
      {values && values.length > 0
        ? values.map((v, inde) => (
            <span key={inde}>
              <span className={styles.chapterItem}>
                {typeof v === "string" ? v.split("-")[0] : v}
              </span>
            </span>
          ))
        : null}
    </div>
  );
}

/**
 * 解析区内：章节、知识点、素养配置；支持整题与子题（组合题 type 6）分别配置。
 * 下拉树数据在组件内请求并缓存（按学科+年级）。
 * @param root0
 * @param root0.styles
 * @param root0.item
 * @param root0.index
 * @param root0.onLabelChange
 * @param root0.getPopupContainer
 */
export default function QuestionMetaBindPanel({
  styles,
  item,
  index,
  onLabelChange,
  getPopupContainer,
}) {
  const [knowledgeTreeLoading, setKnowledgeTreeLoading] = useState(false);
  const [chapterTreeLoading, setChapterTreeLoading] = useState(false);
  const [indicatorTreeLoading, setIndicatorTreeLoading] = useState(false);
  const [knowledgeTreeData, setKnowledgeTreeData] = useState([]);
  const [chapterTreeData, setChapterTreeData] = useState([]);
  const [indicatorTreeData, setIndicatorTreeData] = useState([]);

  const handleQuestionBind = useCallback((question, key, sonIndex) => {
    const { subjectId, gradeId, id } = question;
    const cls = `${key}${id}${sonIndex == undefined ? "" : `_sub_${sonIndex}`}`;
    const cacheKey = metaTreeCacheKey(subjectId, gradeId);

    switch (key) {
      case "knowledge": {
        const cached = metaTreeCache.knowledge[cacheKey];
        if (cached) {
          setKnowledgeTreeData(cached);
          setTimeout(() => openMetaTreeSelect(cls), 0);
          return;
        }
        setKnowledgeTreeLoading(true);
        queryTree({ subjectId, gradeId })
          .then((response) => {
            if (response.ifLogin) {
              if (response.status) {
                const data = response.content;
                metaTreeCache.knowledge[cacheKey] = data;
                setKnowledgeTreeData(data);
                setTimeout(() => openMetaTreeSelect(cls), 0);
              } else {
                message.error(response.message);
              }
            } else {
              loginRedirect();
            }
          })
          .finally(() => {
            setKnowledgeTreeLoading(false);
          });

        break;
      }
      case "chapter": {
        const cached = metaTreeCache.chapter[cacheKey];
        if (cached) {
          setChapterTreeData(cached);
          setTimeout(() => openMetaTreeSelect(cls), 0);
          return;
        }
        setChapterTreeLoading(true);
        queryChapter({
          subjectId,
          gradeId,
          isSegmentation: true,
        })
          .then((response) => {
            if (response.ifLogin) {
              if (response.status) {
                const data = response.content;
                metaTreeCache.chapter[cacheKey] = data;
                setChapterTreeData(data);
                setTimeout(() => openMetaTreeSelect(cls), 0);
              } else {
                message.error(response.message);
              }
            } else {
              loginRedirect();
            }
          })
          .finally(() => {
            setChapterTreeLoading(false);
          });

        break;
      }
      case "indicator": {
        const cached = metaTreeCache.indicator[cacheKey];
        if (cached) {
          setIndicatorTreeData(cached);
          setTimeout(() => openMetaTreeSelect(cls), 0);
          return;
        }
        setIndicatorTreeLoading(true);
        queryLabel({
          subjectId,
          gradeId,
          isSegmentation: true,
        })
          .then((response) => {
            if (response.ifLogin) {
              if (response.status) {
                if (response.content && response.content.length > 0) {
                  const newTree1 = transformIndicatorTree(response.content);
                  metaTreeCache.indicator[cacheKey] = newTree1;
                  setIndicatorTreeData(newTree1);
                  setTimeout(() => openMetaTreeSelect(cls), 0);
                }
              } else {
                message.error(response.message);
              }
            } else {
              loginRedirect();
            }
          })
          .finally(() => {
            setIndicatorTreeLoading(false);
          });

        break;
      }
      // No default
    }
  }, []);

  const treeByMeta = {
    knowledge: knowledgeTreeData,
    chapter: chapterTreeData,
    indicator: indicatorTreeData,
  };
  const loadingByMeta = {
    knowledge: knowledgeTreeLoading,
    chapter: chapterTreeLoading,
    indicator: indicatorTreeLoading,
  };

  return (
    <>
      {META_ROWS.map(({ metaKey, titleKey, titleDefault, classPrefix }) => (
        <div className={styles.analysisItem} key={metaKey}>
          <div className={styles.itemTitle}>
            {trans(titleKey, titleDefault)}
          </div>
          <div className={styles.itemContent} style={{ display: "block" }}>
            <BindRow
              styles={styles}
              metaKey={metaKey}
              classPrefix={classPrefix}
              item={item}
              sonIndex={null}
              treeData={treeByMeta[metaKey]}
              loading={loadingByMeta[metaKey]}
              onQuestionBind={handleQuestionBind}
              onLabelChange={onLabelChange}
              listIndex={index}
              getPopupContainer={getPopupContainer}
            />
            {item.type === 6 &&
            item.sonQuestionList &&
            item.sonQuestionList.length > 0
              ? item.sonQuestionList.map((_, sonIndex) => (
                  <BindRow
                    key={sonIndex}
                    styles={styles}
                    metaKey={metaKey}
                    classPrefix={classPrefix}
                    item={item}
                    sonIndex={sonIndex}
                    treeData={treeByMeta[metaKey]}
                    loading={loadingByMeta[metaKey]}
                    onQuestionBind={handleQuestionBind}
                    onLabelChange={onLabelChange}
                    listIndex={index}
                    getPopupContainer={getPopupContainer}
                  />
                ))
              : null}
          </div>
        </div>
      ))}
    </>
  );
}
