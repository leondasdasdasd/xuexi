const questionTaskSongtiFontLoadState = {
  promise: undefined,
};

export const loadQuestionTaskSongtiFont = (loadRequest) => {
  void loadRequest;

  if (questionTaskSongtiFontLoadState.promise) {
    return questionTaskSongtiFontLoadState.promise;
  }

  questionTaskSongtiFontLoadState.promise =
    import("./questionTaskSongtiFont.css.js");
  return questionTaskSongtiFontLoadState.promise;
};
