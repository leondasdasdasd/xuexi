import React from "react";
import { Icon, message } from "antd";
import PropTypes from "prop-types";
import { Transforms } from "slate";

import {
  createImageNode,
  focusEditor,
} from "../../../../components/SlateRichEditor/shared";
import {
  collapseSelectionToTableCellStart,
  isSelectionAcrossTableCells,
} from "../../../../components/SlateRichEditor/tableCommands";
import { trans } from "../../../../utils/i18n";
import { css } from "./constants";
import { toArray } from "./questionEditorModel";

const focusActiveEditor = (activeEditorController) => {
  if (typeof activeEditorController.focus === "function") {
    activeEditorController.focus();
    return;
  }

  focusEditor(activeEditorController.editor, { ensureSelection: true });
};

const insertSourceImageNode = (activeEditorController, asset) => {
  const { editor } = activeEditorController;

  if (!editor) {
    return false;
  }

  if (
    isSelectionAcrossTableCells(editor) &&
    !collapseSelectionToTableCellStart(editor)
  ) {
    return false;
  }

  focusActiveEditor(activeEditorController);
  Transforms.insertNodes(
    editor,
    createImageNode(asset.imageUrl, asset.title, {
      height: asset.height,
      width: asset.width,
    }),
  );
  return true;
};

const insertSourceImageToEditor = (activeEditorController, asset) => {
  if (!activeEditorController || !asset || !asset.imageUrl) {
    return false;
  }

  if (typeof activeEditorController.insertImage === "function") {
    return activeEditorController.insertImage(asset.imageUrl, asset.title, {
      height: asset.height,
      width: asset.width,
    });
  }

  return insertSourceImageNode(activeEditorController, asset);
};

const getSourceImagePageNumber = (asset) => asset.pageNumber || asset.pageIndex;

const getSourceImagePageLabel = (asset) => {
  const pageNumber = getSourceImagePageNumber(asset);

  return pageNumber
    ? trans("questionTask.sourcePageImagePageLabel", "第 {$pageNumber} 页", {
        pageNumber,
      })
    : "";
};

const renderSourceImageToggleContent = (isCollapsed, imageCount) => (
  <>
    <Icon type={isCollapsed ? "right" : "left"} />
    {isCollapsed ? (
      <span className={css.sourceImageCount}>
        {trans("questionTask.sourcePageImagesCompact", "配图{$count}", {
          count: imageCount,
        })}
      </span>
    ) : (
      <span className={css.sourceImageCount}>
        {trans(
          "questionTask.sourcePageImagesWithCount",
          "本页图片 {$count} 张",
          {
            count: imageCount,
          },
        )}
      </span>
    )}
  </>
);

const renderSourceImagePageChips = (isCollapsed, pageLabels) => {
  if (isCollapsed || pageLabels.length === 0) {
    return false;
  }

  return (
    <div className={css.sourceImagePageChips}>
      {pageLabels.map((pageLabel) => (
        <span key={pageLabel}>{pageLabel}</span>
      ))}
    </div>
  );
};

const renderSourceImageList = ({ imageAssets, isCollapsed, onImageInsert }) => {
  if (isCollapsed) {
    return false;
  }

  return (
    <div className={css.sourceImageList}>
      {imageAssets.map((asset, index) => {
        const title =
          asset.title ||
          trans(
            "questionTask.sourcePageImageDefaultTitle",
            "第 {$pageNumber} 页图片 {$index}",
            {
              index: index + 1,
              pageNumber: getSourceImagePageNumber(asset) || "-",
            },
          );
        const pageLabel = getSourceImagePageLabel(asset);

        return (
          <button
            aria-label={trans(
              "questionTask.insertSourcePageImage",
              "插入图片：{$title}",
              { title },
            )}
            className={css.sourceImageButton}
            key={asset.id || `${asset.imageUrl}-${index}`}
            onClick={(event) => {
              void event;
              onImageInsert({ ...asset, title });
            }}
            onMouseDown={(event) => {
              // 保留 Slate 当前选区，确保从图片带插图时能落到刚才的光标位置。
              event.preventDefault();
            }}
            title={title}
            type="button"
          >
            <span className={css.sourceImageThumbnail}>
              <img alt={title} src={asset.imageUrl} />
              {pageLabel ? (
                <span className={css.sourceImagePageBadge}>{pageLabel}</span>
              ) : (
                false
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const PageImageAssetPicker = ({
  activeEditorController,
  isCollapsed,
  onCollapsedChange,
  sourceImageAssets,
}) => {
  const imageAssets = toArray(sourceImageAssets).filter(
    (asset) => asset && asset.imageUrl,
  );

  if (imageAssets.length === 0) {
    return false;
  }

  const handleImageInsert = (asset) => {
    const inserted = insertSourceImageToEditor(activeEditorController, asset);

    if (!inserted) {
      message.info(
        trans(
          "questionTask.clickRichTextBeforeInsertImage",
          "先点击要插入图片的位置",
        ),
      );
    }
  };

  const pageLabels = [
    ...new Set(
      imageAssets
        .map((asset) => getSourceImagePageLabel(asset))
        .filter(Boolean),
    ),
  ];
  const toggleLabel = isCollapsed
    ? trans("questionTask.expandSourcePageImages", "展开本页图片")
    : trans("questionTask.collapseSourcePageImages", "收起本页图片");

  return (
    <div
      className={`${css.sourceImageStrip} ${
        isCollapsed ? css.sourceImageStripCollapsed : ""
      }`}
      data-testid="source-image-strip"
    >
      <div className={css.sourceImageStripHeader}>
        <button
          aria-expanded={!isCollapsed}
          aria-label={toggleLabel}
          className={css.sourceImageToggle}
          data-testid="source-image-toggle"
          onClick={(event) => {
            event.preventDefault();
            onCollapsedChange(!isCollapsed);
          }}
          title={toggleLabel}
          type="button"
        >
          {renderSourceImageToggleContent(isCollapsed, imageAssets.length)}
        </button>
        {renderSourceImagePageChips(isCollapsed, pageLabels)}
      </div>
      {renderSourceImageList({
        imageAssets,
        isCollapsed,
        onImageInsert: handleImageInsert,
      })}
    </div>
  );
};

PageImageAssetPicker.propTypes = {
  activeEditorController: PropTypes.shape({
    editor: PropTypes.object,
    focus: PropTypes.func,
    insertImage: PropTypes.func,
  }),
  isCollapsed: PropTypes.bool,
  onCollapsedChange: PropTypes.func.isRequired,
  sourceImageAssets: PropTypes.arrayOf(PropTypes.object),
};

PageImageAssetPicker.defaultProps = {
  activeEditorController: undefined,
  isCollapsed: false,
  sourceImageAssets: [],
};

export default PageImageAssetPicker;
