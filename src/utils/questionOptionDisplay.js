export const OPTION_KEYS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export const getIndexedOptionKey = (index) => {
  const normalizedIndex = Number(index || 0);

  return (
    OPTION_KEYS.slice(normalizedIndex, normalizedIndex + 1).shift() ||
    String(normalizedIndex + 1)
  );
};

export const getQuestionOptionDisplayKey = (option, index) =>
  option && option.key ? option.key : getIndexedOptionKey(index);
