import React from "react";

import { getBusinessQuestionTypeLabel } from "./questionTypeRegistry.js";

interface ResourceQuestionType {
  businessQuestionTypeId: number;
  label: string;
}

interface ResourceQuestionTypeLabelProps {
  businessQuestionTypeId: number;
  className?: string;
  questionTypes: ResourceQuestionType[];
}

/**
 * 使用当前教学上下文的业务题型目录展示资源题目类型。
 * @param {ResourceQuestionTypeLabelProps} properties 资源题目类型展示参数。
 * @param {number} properties.businessQuestionTypeId 资源题目的业务题型 ID。
 * @param {string} properties.className 展示节点样式类名。
 * @param {ResourceQuestionType[]} properties.questionTypes 当前教学上下文题型目录。
 * @returns {React.ReactElement} 业务题型名称。
 */
function ResourceQuestionTypeLabel({
  businessQuestionTypeId,
  className,
  questionTypes,
}: ResourceQuestionTypeLabelProps) {
  return (
    <span className={className}>
      {getBusinessQuestionTypeLabel(questionTypes, businessQuestionTypeId)}
    </span>
  );
}

export default ResourceQuestionTypeLabel;
