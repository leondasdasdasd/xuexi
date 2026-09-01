export const hasPaperUploadFile = (item) =>
  item?.paperUploadFileId !== null &&
  item?.paperUploadFileId !== undefined &&
  item?.paperUploadFileId !== "";
