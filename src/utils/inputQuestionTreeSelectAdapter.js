const toTreeList = (value) => (Array.isArray(value) ? value : []);

const normalizeTreeNodeId = (value) => {
  if (value === undefined || value === "" || value === null) {
    return;
  }

  const text = String(value).trim();
  if (!text) {
    return;
  }

  const lastPart = text.split("-").pop();
  const id = Number(/^\d+$/.test(lastPart) ? lastPart : text);

  return Number.isFinite(id) ? id : undefined;
};

const getInputQuestionTreeNodeValue = (node, index) => {
  const rawValue =
    node?.value === undefined
      ? node?.id === undefined
        ? `${index}`
        : node.id
      : node.value;
  const normalizedId = normalizeTreeNodeId(rawValue);

  return normalizedId === undefined ? rawValue : normalizedId;
};

const getInputQuestionTreeNodeTitle = (node, value) =>
  node?.title || node?.text || node?.name || node?.label || String(value);

/**
 * 将 inputQuestion 接口树统一转换为 Ant TreeSelect 的展示契约。
 * @param {object[]} inputQuestionTree inputQuestion 章节、知识点或素养树。
 * @returns {object[]} Ant TreeSelect options。
 */
export const createAntTreeSelectOptionsFromInputQuestionTree = (
  inputQuestionTree,
) =>
  toTreeList(inputQuestionTree).map((node, index) => {
    const value = getInputQuestionTreeNodeValue(node, index);

    return {
      children: createAntTreeSelectOptionsFromInputQuestionTree(node?.children),
      key: node?.key === undefined ? value : node.key,
      title: getInputQuestionTreeNodeTitle(node, value),
      value,
    };
  });
