export interface PaperPdfLayoutBlock {
  bottom: number;
  keepWithNext?: boolean;
  top: number;
}

export interface PaperPdfPageRange {
  end: number;
  start: number;
}

interface PaperPdfPaginationInput {
  blocks: PaperPdfLayoutBlock[];
  contentHeight: number;
  pageHeight: number;
}

interface PaperPdfLayoutGroup extends PaperPdfLayoutBlock {
  groupBottom: number;
}

const MINIMUM_RANGE_HEIGHT = 0.5;

const createLayoutGroups = (
  blocks: PaperPdfLayoutBlock[],
): PaperPdfLayoutGroup[] => {
  let nextBlock: PaperPdfLayoutBlock | undefined;
  return [...blocks]
    .reverse()
    .map((block) => {
      const group = {
        ...block,
        groupBottom:
          block.keepWithNext && nextBlock ? nextBlock.bottom : block.bottom,
      };
      nextBlock = block;
      return group;
    })
    .reverse();
};

const findPageEnd = (
  groups: PaperPdfLayoutGroup[],
  pageStart: number,
  maximumPageEnd: number,
  pageHeight: number,
): number => {
  for (const group of groups) {
    const groupHeight = group.groupBottom - group.top;
    const startsAfterPage = group.top >= maximumPageEnd;
    if (startsAfterPage) break;

    const crossesPage = group.groupBottom > maximumPageEnd;
    const canMoveAsUnit = groupHeight <= pageHeight;
    const leavesPageContent = group.top - pageStart >= MINIMUM_RANGE_HEIGHT;
    if (crossesPage && canMoveAsUnit && leavesPageContent) {
      return group.top;
    }
  }
  return maximumPageEnd;
};

/**
 * 按题目语义块计算连续 PDF 页面区间；超高题目按固定页高连续切分。
 * @param {PaperPdfPaginationInput} input 已测量的正文高度、页面容量和语义块。
 * @returns {PaperPdfPageRange[]} 首尾连续且完整覆盖正文的页面区间。
 */
export const calculatePaperPdfPageRanges = (
  input: PaperPdfPaginationInput,
): PaperPdfPageRange[] => {
  const { contentHeight, pageHeight } = input;
  if (contentHeight <= 0 || pageHeight <= 0) return [];

  const blocks = [...input.blocks]
    .filter((block) => block.bottom > block.top)
    .sort((left, right) => left.top - right.top);
  const groups = createLayoutGroups(blocks);
  const ranges: PaperPdfPageRange[] = [];
  let pageStart = 0;
  while (pageStart < contentHeight) {
    const maximumPageEnd = Math.min(pageStart + pageHeight, contentHeight);
    const measuredPageEnd = findPageEnd(
      groups,
      pageStart,
      maximumPageEnd,
      pageHeight,
    );
    const pageEnd =
      measuredPageEnd - pageStart >= MINIMUM_RANGE_HEIGHT
        ? measuredPageEnd
        : maximumPageEnd;
    ranges.push({ end: pageEnd, start: pageStart });
    pageStart = pageEnd;
  }
  return ranges;
};
