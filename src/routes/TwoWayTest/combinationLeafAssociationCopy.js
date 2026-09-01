import { trans } from "../../utils/i18n";

export const combinationLeafAssociationCopy = {
  cancel: trans("global.cancle", "取消"),
  confirm: trans("twoWayTest.confirmAssociation", "确认关联"),
  currentRange: trans("twoWayTest.currentPaperPositions", "当前试卷题号"),
  endNumber: trans("twoWayTest.endPosition", "结束题号"),
  leafRange: trans("twoWayTest.combinationLeaves", "组合题叶子"),
  printNote: trans(
    "twoWayTest.leafAssociationPrintNote",
    "错题打印：打印原题题干和对应叶子题。",
  ),
  rangeTitle: trans("twoWayTest.consecutivePositions", "连续题号"),
  targetLeaf: (questionNumber) =>
    trans("twoWayTest.mapsToPaperQuestion", "对应当前第 {$number} 题", {
      number: questionNumber,
    }),
  title: trans("twoWayTest.associateCombinationLeaves", "关联组合题叶子"),
};

export const getCombinationLeafRangeDescription = ({
  endNumber,
  startNumber,
}) =>
  trans(
    "twoWayTest.leafAssociationRangeDescription",
    "从当前第 {$startNumber} 题开始，必须连续到第 {$endNumber} 题；确认后题号保持不变，每个题位会标记为叶子题。",
    { endNumber, startNumber },
  );
