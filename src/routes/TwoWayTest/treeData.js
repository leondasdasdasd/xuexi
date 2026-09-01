/**
 *
 * @param list
 */
export function convertQualityDialogTreeData(list) {
  return list?.map((item) => ({
    title: item.name,
    value: `${item.name}-${item.pinyin}`,
    key: item.id,
    children: item.indicatorSon
      ? convertQualityDialogTreeData(item.indicatorSon)
      : null,
  }));
}

/**
 *
 * @param list
 */
export function convertQualityTreeData(list) {
  return list.map((item) => ({
    title: item.name,
    value: item.id,
    key: item.id,
    // selectable: item.indicatorSon ? false : true,//细目表中关联知识点时，无法选择节点
    pinyin: item.pinyin,
    children: item.indicatorSon
      ? convertQualityTreeData(item.indicatorSon)
      : null,
  }));
}
