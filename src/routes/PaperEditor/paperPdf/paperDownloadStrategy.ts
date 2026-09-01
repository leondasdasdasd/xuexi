export type PaperDownloadTarget = "browser-pdf" | "source-file" | "unavailable";

interface PaperDownloadSource {
  hasStructuredContent?: boolean;
  uploadFileEditable?: unknown;
  uploadFileExist?: unknown;
}

/**
 * 统一决定 legacy 页面应下载结构化 PDF 还是保留上传原件。
 * @param {PaperDownloadSource} source 页面已有的试卷来源标记。
 * @returns {PaperDownloadTarget} 下载目标，不执行任何 I/O。
 */
export const resolvePaperDownloadTarget = (
  source: PaperDownloadSource,
): PaperDownloadTarget => {
  const uploadFileExists =
    source.uploadFileExist === 1 || source.uploadFileExist === "1";
  const uploadFileMissing =
    source.uploadFileExist === 0 || source.uploadFileExist === "0";
  if (
    source.hasStructuredContent ||
    uploadFileMissing ||
    (uploadFileExists && Boolean(source.uploadFileEditable))
  ) {
    return "browser-pdf";
  }
  return uploadFileExists ? "source-file" : "unavailable";
};
