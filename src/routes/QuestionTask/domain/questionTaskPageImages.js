import { trans } from "../../../utils/i18n";
import { getOneBasedIndex, toArray } from "./questionTaskShared";

const MOCK_TASK_ID = "mock";
const MOCK_IMAGE_WIDTH = 280;
const MOCK_IMAGE_HEIGHT = 180;
const MOCK_IMAGE_COUNT = 2;
const MOCK_IMAGE_INNER_MARGIN = 12;
const MOCK_IMAGE_TITLE_X = 24;
const MOCK_IMAGE_TITLE_Y = 36;
const MOCK_IMAGE_FIGURE_X = 52;
const MOCK_IMAGE_FIGURE_Y = 64;
const MOCK_IMAGE_FIGURE_WIDTH = 176;
const MOCK_IMAGE_FIGURE_HEIGHT = 76;
const MOCK_IMAGE_INNER_DOUBLE = 2;
const MOCK_CURVE_FIRST_CONTROL_X_OFFSET = 42;
const MOCK_CURVE_CONTROL_Y_OFFSET = 8;
const MOCK_CURVE_SECOND_CONTROL_X_OFFSET = 108;
const FIRST_INDEX = 0;

const getDefinedValue = (values) =>
  values.find((value) => value !== undefined && value !== null);

const getFiniteNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const escapeSvgText = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const encodeSvgDataUrl = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const getRawPageRecognizedImages = (page) => {
  const source = page || {};

  if (Array.isArray(source.recognizedImages)) {
    return source.recognizedImages;
  }
  if (Array.isArray(source.mediaList)) {
    return source.mediaList;
  }
  if (Array.isArray(source.pageImages)) {
    return source.pageImages;
  }
  if (Array.isArray(source.imageList)) {
    return source.imageList;
  }
  return [];
};

const getImageUrl = (source) =>
  source.imageUrl || source.url || source.src || "";

const getImageTitle = (source, imageNumber, pageState) => {
  const pageNumber = getDefinedValue([
    pageState.pageNumber,
    pageState.pageIndex,
  ]);

  return (
    source.title ||
    source.name ||
    trans(
      "questionTask.sourcePageImageDefaultTitle",
      "第 {$pageNumber} 页图片 {$index}",
      {
        index: imageNumber,
        pageNumber,
      },
    )
  );
};

const normalizePageRecognizedImage = (image, imageIndex, pageState) => {
  const source = image || {};
  const imageUrl = getImageUrl(source);

  if (!imageUrl) {
    return;
  }

  const imageNumber = getOneBasedIndex(imageIndex);

  return {
    bounds: source.bounds || source.rect || undefined,
    height: getFiniteNumber(source.height),
    id:
      source.id ||
      `${pageState.pageKey || "page"}-recognized-image-${imageNumber}`,
    imageUrl,
    pageIndex: pageState.pageIndex,
    pageNumber: pageState.pageNumber,
    title: getImageTitle(source, imageNumber, pageState),
    width: getFiniteNumber(source.width),
  };
};

export const normalizePageRecognizedImages = (page, pageState) =>
  getRawPageRecognizedImages(page)
    .map((image, index) =>
      normalizePageRecognizedImage(image, index, pageState),
    )
    .filter(Boolean);

const getQuestionExplicitCurrentPageMatcher = (question) => {
  const source = question || {};
  const explicitPageIndex = getFiniteNumber(
    getDefinedValue([
      source.pageIndex,
      source.startPageIndex,
      toArray(source.sourcePageIndexes)[FIRST_INDEX],
      toArray(source.pageIndexes)[FIRST_INDEX],
      toArray(source.pageIndexList)[FIRST_INDEX],
    ]),
  );

  if (explicitPageIndex !== undefined) {
    return (page) =>
      getFiniteNumber(page && page.pageIndex) === explicitPageIndex;
  }

  const explicitPageNumber = getFiniteNumber(
    getDefinedValue([
      source.pageNumber,
      source.startPageNumber,
      toArray(source.sourcePageNumbers)[FIRST_INDEX],
      toArray(source.pageNumbers)[FIRST_INDEX],
    ]),
  );

  if (explicitPageNumber !== undefined) {
    return (page) =>
      getFiniteNumber(page && page.pageNumber) === explicitPageNumber;
  }

  return (page) => {
    void page;
    return false;
  };
};

const isSameQuestionDraft = (leftQuestion, rightQuestion) =>
  !!(
    leftQuestion &&
    rightQuestion &&
    leftQuestion.draftId &&
    leftQuestion.draftId === rightQuestion.draftId
  );

const isQuestionInQuestionTree = (targetQuestion, sourceQuestion) =>
  isSameQuestionDraft(targetQuestion, sourceQuestion) ||
  (Array.isArray(sourceQuestion && sourceQuestion.sonQuestionList)
    ? sourceQuestion.sonQuestionList
    : []
  ).some((childQuestion) =>
    isQuestionInQuestionTree(targetQuestion, childQuestion),
  );

const isQuestionInPage = (question, page) => {
  if (!question || !question.draftId) {
    return false;
  }

  return (Array.isArray(page && page.questions) ? page.questions : []).some(
    (pageQuestion) => isQuestionInQuestionTree(question, pageQuestion),
  );
};

const getQuestionTaskPages = (question, pages) =>
  pages.filter((page) => isQuestionInPage(question, page));

const getMockImageTitle = (page, imageIndex) =>
  trans(
    "questionTask.mockSourcePageImageTitle",
    "第 {$pageNumber} 页识别图 {$index}",
    {
      index: getOneBasedIndex(imageIndex),
      pageNumber: getDefinedValue([page.pageNumber, page.pageIndex]),
    },
  );

const createMockImageUrl = (title) =>
  encodeSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${MOCK_IMAGE_WIDTH}" height="${MOCK_IMAGE_HEIGHT}" viewBox="0 0 ${MOCK_IMAGE_WIDTH} ${MOCK_IMAGE_HEIGHT}">
      <rect width="${MOCK_IMAGE_WIDTH}" height="${MOCK_IMAGE_HEIGHT}" fill="#ffffff" />
      <rect x="${MOCK_IMAGE_INNER_MARGIN}" y="${MOCK_IMAGE_INNER_MARGIN}" width="${MOCK_IMAGE_WIDTH - MOCK_IMAGE_INNER_MARGIN * MOCK_IMAGE_INNER_DOUBLE}" height="${MOCK_IMAGE_HEIGHT - MOCK_IMAGE_INNER_MARGIN * MOCK_IMAGE_INNER_DOUBLE}" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="${MOCK_IMAGE_TITLE_X}" y="${MOCK_IMAGE_TITLE_Y}" font-size="15" font-family="Arial, sans-serif" fill="#334155">${escapeSvgText(title)}</text>
      <path d="M${MOCK_IMAGE_FIGURE_X} ${MOCK_IMAGE_FIGURE_Y + MOCK_IMAGE_FIGURE_HEIGHT} C${MOCK_IMAGE_FIGURE_X + MOCK_CURVE_FIRST_CONTROL_X_OFFSET} ${MOCK_IMAGE_FIGURE_Y + MOCK_CURVE_CONTROL_Y_OFFSET}, ${MOCK_IMAGE_FIGURE_X + MOCK_CURVE_SECOND_CONTROL_X_OFFSET} ${MOCK_IMAGE_FIGURE_Y + MOCK_CURVE_CONTROL_Y_OFFSET}, ${MOCK_IMAGE_FIGURE_X + MOCK_IMAGE_FIGURE_WIDTH} ${MOCK_IMAGE_FIGURE_Y + MOCK_IMAGE_FIGURE_HEIGHT}" fill="none" stroke="#0445fc" stroke-width="3" />
      <line x1="${MOCK_IMAGE_FIGURE_X}" y1="${MOCK_IMAGE_FIGURE_Y + MOCK_IMAGE_FIGURE_HEIGHT}" x2="${MOCK_IMAGE_FIGURE_X + MOCK_IMAGE_FIGURE_WIDTH}" y2="${MOCK_IMAGE_FIGURE_Y + MOCK_IMAGE_FIGURE_HEIGHT}" stroke="#334155" />
      <line x1="${MOCK_IMAGE_FIGURE_X}" y1="${MOCK_IMAGE_FIGURE_Y + MOCK_IMAGE_FIGURE_HEIGHT}" x2="${MOCK_IMAGE_FIGURE_X}" y2="${MOCK_IMAGE_FIGURE_Y}" stroke="#334155" />
    </svg>
  `);

const createMockRecognizedImage = (page, imageIndex) => {
  const title = getMockImageTitle(page, imageIndex);

  return {
    height: MOCK_IMAGE_HEIGHT,
    id: `${page.pageKey || page.pageIndex || "page"}-mock-image-${getOneBasedIndex(
      imageIndex,
    )}`,
    imageUrl: createMockImageUrl(title),
    pageIndex: page.pageIndex,
    pageNumber: page.pageNumber,
    title,
    width: MOCK_IMAGE_WIDTH,
  };
};

const createMockRecognizedImages = (page) => {
  // mock 任务用于验证“本页图片”素材池，多图更接近切图纠错时的真实使用场景。
  return Array.from({ length: MOCK_IMAGE_COUNT }, (unusedItem, imageIndex) => {
    void unusedItem;
    return createMockRecognizedImage(page, imageIndex);
  });
};

const shouldUseMockPageImages = (page, taskResult) =>
  taskResult &&
  taskResult.taskId === MOCK_TASK_ID &&
  page &&
  page.imageUrl &&
  normalizePageRecognizedImages(page, page).length === FIRST_INDEX;

const getPageImageAssets = (page, taskResult) => {
  const recognizedImages = Array.isArray(page && page.recognizedImages)
    ? page.recognizedImages
    : [];

  return recognizedImages.length > FIRST_INDEX ||
    !shouldUseMockPageImages(page, taskResult)
    ? recognizedImages
    : createMockRecognizedImages(page);
};

export const getQuestionSourcePageImageAssets = (question, taskResult) => {
  const pages = Array.isArray(taskResult && taskResult.pages)
    ? taskResult.pages
    : [];
  const taskPages = getQuestionTaskPages(question, pages);
  const sourcePages =
    taskPages.length > FIRST_INDEX
      ? taskPages
      : pages.filter(getQuestionExplicitCurrentPageMatcher(question));

  if (sourcePages.length === FIRST_INDEX || pages.length === FIRST_INDEX) {
    return [];
  }

  return sourcePages
    .flatMap((page) =>
      getPageImageAssets(page, taskResult).map((image) => ({
        ...image,
        pageIndex: getDefinedValue([image.pageIndex, page.pageIndex]),
        pageNumber: getDefinedValue([image.pageNumber, page.pageNumber]),
      })),
    )
    .filter((image) => image && image.imageUrl);
};
