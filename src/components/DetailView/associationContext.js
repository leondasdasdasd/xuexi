export const getAssociationParentContent = (question) =>
  question &&
  question.associationContext &&
  question.associationContext.parentContent
    ? question.associationContext.parentContent
    : undefined;
