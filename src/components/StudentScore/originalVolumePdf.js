import { jsPDF } from "jspdf/dist/jspdf.umd.min";
import JSZip from "jszip";

import {
  buildOriginalVolumeNoCacheUrl,
  cleanOriginalVolumePathName,
} from "./originalVolumeZip";

const PDF_SUFFIX = ".pdf";
const ORIGINAL_VOLUME_SUFFIX = "-原卷";
const DEFAULT_NAME = "未命名";
const PDF_MARGIN_MM = 0;
const HTTP_SUCCESS_MIN_STATUS = 200;
const HTTP_REDIRECT_MAX_STATUS = 400;
const JPEG_QUALITY = 0.92;
const CENTER_DIVISOR = 2;

/**
 * 创建 jsPDF 实例；懒加载可避免测试环境在未生成 PDF 时初始化浏览器相关依赖。
 * @param {object} configuration PDF 初始化配置。
 * @returns {object} jsPDF 实例。
 */
function createDefaultPdf(configuration = {}) {
  return new jsPDF({
    unit: configuration.unit || "mm",
    format: configuration.format || "a4",
  });
}

/**
 * 使用 XMLHttpRequest 读取原卷图片 Blob，保持与 zip 导出一致的浏览器端读取方式。
 * @param {string} imageUrl 原卷图片地址。
 * @returns {Promise<Blob>} 图片 Blob。
 */
function requestImageBlob(imageUrl) {
  return new JSZip.external.Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", buildOriginalVolumeNoCacheUrl(imageUrl), true);
    request.responseType = "blob";
    request.addEventListener("load", () => {
      if (
        request.status >= HTTP_SUCCESS_MIN_STATUS &&
        request.status < HTTP_REDIRECT_MAX_STATUS
      ) {
        resolve(request.response);
      } else {
        reject(new Error(`图片服务响应异常，status=${request.status}`));
      }
    });
    request.addEventListener("error", () => {
      reject(new Error("图片读取请求失败"));
    });
    request.send();
  });
}

/**
 * 将 Blob 转为 data URL，便于浏览器图片解码和 jsPDF 写入。
 * @param {Blob} blob 图片 Blob。
 * @returns {Promise<string>} 图片 data URL。
 */
function readBlobAsDataUrl(blob) {
  return new JSZip.external.Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(reader.result);
    });
    reader.addEventListener("error", () => {
      reject(reader.error || new Error("图片内容读取失败"));
    });
    reader.readAsDataURL(blob);
  });
}

/**
 * 将 data URL 解码为图片对象。
 * @param {string} dataUrl 图片 data URL。
 * @returns {Promise<HTMLImageElement>} 已加载图片。
 */
function loadImageElement(dataUrl) {
  return new JSZip.external.Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      resolve(image);
    });
    image.addEventListener("error", () => {
      reject(new Error("图片解码失败"));
    });
    image.src = dataUrl;
  });
}

/**
 * 将图片统一转为 JPEG data URL，避免不同原图格式在 PDF 写入时兼容性不一致。
 * @param {HTMLImageElement} image 已加载图片。
 * @returns {{dataUrl: string, width: number, height: number}} PDF 写入图片信息。
 */
function convertImageToJpegData(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * 读取原卷图片并转换成 PDF 可写入的 JPEG 数据。
 * @param {string} imageUrl 原卷图片地址。
 * @returns {Promise<{dataUrl: string, width: number, height: number}>} 图片数据。
 */
function loadOriginalVolumePdfImage(imageUrl) {
  return requestImageBlob(imageUrl)
    .then(readBlobAsDataUrl)
    .then(loadImageElement)
    .then(convertImageToJpegData);
}

/**
 * 过滤学生得分列表中的汇总行，只保留真实学生。
 * @param {Array<object>} studentList 接口返回的学生列表。
 * @returns {Array<object>} 真实学生列表。
 */
function filterOriginalVolumePdfStudents(studentList) {
  return (studentList || []).filter((student) => student?.studentUserId);
}

/**
 * 计算图片在当前 PDF 页面内的等比缩放尺寸。
 * @param {object} pdf jsPDF 实例。
 * @param {object} imageData 图片数据。
 * @returns {{x: number, y: number, width: number, height: number}} 页面内图片位置和尺寸。
 */
function calculateImagePlacement(pdf, imageData) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const availableWidth = pageWidth - PDF_MARGIN_MM * CENTER_DIVISOR;
  const availableHeight = pageHeight - PDF_MARGIN_MM * CENTER_DIVISOR;
  const imageRatio = imageData.width / imageData.height;
  const availableRatio = availableWidth / availableHeight;
  const width = imageRatio > availableRatio ? availableWidth : availableHeight * imageRatio;
  const height = imageRatio > availableRatio ? availableWidth / imageRatio : availableHeight;
  return {
    x: (pageWidth - width) / CENTER_DIVISOR,
    y: (pageHeight - height) / CENTER_DIVISOR,
    width,
    height,
  };
}

/**
 * 向 PDF 写入单张原卷图片，除第一张外先新增页面。
 * @param {object} pdf jsPDF 实例。
 * @param {object} imageData 图片数据。
 * @param {boolean} firstPage 是否为第一张图片。
 * @returns {void}
 */
function addImageToPdf(pdf, imageData, firstPage) {
  if (!firstPage) {
    pdf.addPage();
  }
  const placement = calculateImagePlacement(pdf, imageData);
  pdf.addImage(
    imageData.dataUrl,
    "JPEG",
    placement.x,
    placement.y,
    placement.width,
    placement.height,
  );
}

/**
 * 构建班级原卷 PDF 文件名。
 * @param {string} examName 测验名称。
 * @param {string} groupName 班级名称。
 * @returns {string} PDF 文件名。
 */
function buildOriginalVolumePdfFileName(examName, groupName) {
  return `${cleanOriginalVolumePathName(examName)}-${cleanOriginalVolumePathName(groupName)}${ORIGINAL_VOLUME_SUFFIX}${PDF_SUFFIX}`;
}

/**
 * 按数组顺序将所有图片写入 PDF。
 * @param {object} pdf jsPDF 实例。
 * @param {Array<object>} imageDataList 图片数据列表。
 * @param {boolean} firstPage 当前图片是否写入第一页。
 * @returns {void}
 */
function addImageListToPdf(pdf, imageDataList, firstPage = true) {
  if (imageDataList.length === 0) {
    return;
  }
  const [imageData, ...restImageDataList] = imageDataList;
  addImageToPdf(pdf, imageData, firstPage);
  addImageListToPdf(pdf, restImageDataList, false);
}

/**
 * 生成班级原卷 PDF。
 * @param {object} options 生成参数。
 * @param {string} options.examName 测验名称。
 * @param {string} options.groupName 班级名称。
 * @param {Array<object>} options.studentList 班级学生列表。
 * @param {Function} options.createPdf PDF 创建函数，测试可注入。
 * @param {Function} options.loadImage 图片读取函数，测试可注入。
 * @returns {Promise<{pdf: object, fileName: string}>} PDF 实例和文件名。
 */
export async function buildOriginalVolumePdf(options) {
  const {
    examName,
    groupName,
    studentList,
    createPdf = createDefaultPdf,
    loadImage = loadOriginalVolumePdfImage,
  } = options || {};
  const students = filterOriginalVolumePdfStudents(studentList);
  if (students.length === 0) {
    return JSZip.external.Promise.reject(new Error("没有可导出的学生原卷"));
  }
  const pdf = createPdf();
  const imageTasks = students.flatMap((student) => {
    const paperUrlList = student.studentExamPaperUrl || [];
    if (paperUrlList.length === 0) {
      return [
        JSZip.external.Promise.reject(
          new Error(`学生【${student.studentName || DEFAULT_NAME}】没有原卷图片`),
        ),
      ];
    }
    return paperUrlList.map((paperUrl, pageIndex) => {
      return loadImage(paperUrl).catch((error) => {
        return JSZip.external.Promise.reject(
          new Error(
            `学生【${student.studentName || DEFAULT_NAME}】第${pageIndex + 1}张图片读取失败，原因=${error?.message || "未知错误"}`,
          ),
        );
      });
    });
  });
  const imageDataList = await JSZip.external.Promise.all(imageTasks);
  addImageListToPdf(pdf, imageDataList);
  return {
    pdf,
    fileName: buildOriginalVolumePdfFileName(examName, groupName),
  };
}

/**
 * 下载生成后的班级原卷 PDF。
 * @param {object} options 下载参数。
 * @param {object} options.pdf jsPDF 实例。
 * @param {string} options.fileName PDF 文件名。
 * @returns {void}
 */
export function downloadOriginalVolumePdf({ pdf, fileName }) {
  pdf.save(fileName);
}
