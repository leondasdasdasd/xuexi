import JSZip from "jszip";

const DEFAULT_NAME = "未命名";
const ORIGINAL_VOLUME_SUFFIX = "-原卷";
const ZIP_SUFFIX = ".zip";
const DEFAULT_IMAGE_SUFFIX = ".jpg";
const HTTP_SUCCESS_MIN_STATUS = 200;
const HTTP_REDIRECT_MAX_STATUS = 400;
const INVALID_WINDOWS_FILE_CHARS = /["*/:<>?\\|]/g;
const CONTROL_CHARS = /[\t\n\r]/g;
const TRAILING_DOTS = /\.+$/g;
const MAX_PATH_SEGMENT_LENGTH = 120;
const CACHE_BUSTER_PARAMETER = "_originalVolumeExportNoCache";
const ALLOWED_IMAGE_SUFFIX_SET = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
]);

/**
 * 判断追加缓存参数时应使用的连接符，避免破坏已有查询参数。
 * @param {string} imageUrl 不含 hash 的图片地址。
 * @returns {string} 查询参数连接符。
 */
function resolveCacheBusterSeparator(imageUrl) {
  if (!imageUrl.includes("?")) {
    return "?";
  }
  if (imageUrl.endsWith("?") || imageUrl.endsWith("&")) {
    return "";
  }
  return "&";
}

/**
 * 为原卷图片读取追加前端缓存绕过参数，避免浏览器复用预览图缓存导致 XHR 读取失败。
 * @param {string} imageUrl 原卷图片地址。
 * @param {string|number} cacheKey 本次读取的缓存键，测试可注入。
 * @returns {string} 带缓存绕过参数的图片地址。
 */
export function buildOriginalVolumeNoCacheUrl(imageUrl, cacheKey = Date.now()) {
  const urlText = String(imageUrl || "");
  if (!urlText) {
    return urlText;
  }
  const hashIndex = urlText.indexOf("#");
  const urlWithoutHash = hashIndex >= 0 ? urlText.slice(0, hashIndex) : urlText;
  const hashText = hashIndex >= 0 ? urlText.slice(hashIndex) : "";
  const separator = resolveCacheBusterSeparator(urlWithoutHash);
  return `${urlWithoutHash}${separator}${CACHE_BUSTER_PARAMETER}=${encodeURIComponent(cacheKey)}${hashText}`;
}

/**
 * 清理 zip 内路径段，避免非法字符、空白名和点号路径段导致解压异常。
 * @param {string} name 原始展示名称。
 * @returns {string} 可用于 zip 路径的名称。
 */
export function cleanOriginalVolumePathName(name) {
  if (!String(name || "").trim()) {
    return DEFAULT_NAME;
  }
  const cleaned = String(name)
    .trim()
    .replaceAll(INVALID_WINDOWS_FILE_CHARS, "_")
    .replaceAll(CONTROL_CHARS, "_")
    .replaceAll(TRAILING_DOTS, "");
  if (!cleaned.trim() || cleaned === "." || cleaned === "..") {
    return DEFAULT_NAME;
  }
  return cleaned.length > MAX_PATH_SEGMENT_LENGTH
    ? cleaned.slice(0, MAX_PATH_SEGMENT_LENGTH)
    : cleaned;
}

/**
 * 解析图片 URL 的文件后缀，只保留服务端允许的常见图片类型。
 * @param {string} imageUrl 原卷图片地址。
 * @returns {string} 小写图片后缀。
 */
export function resolveOriginalVolumeImageSuffix(imageUrl) {
  if (!String(imageUrl || "").trim()) {
    return DEFAULT_IMAGE_SUFFIX;
  }
  const path = String(imageUrl).trim().split("?")[0];
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex >= fileName.length - 1) {
    return DEFAULT_IMAGE_SUFFIX;
  }
  const suffix = fileName.slice(dotIndex).toLowerCase();
  return ALLOWED_IMAGE_SUFFIX_SET.has(suffix) ? suffix : DEFAULT_IMAGE_SUFFIX;
}

/**
 * 生成重复路径名的唯一名称，重复时追加学生或班级业务标识。
 * @param {string} displayName 原始展示名称。
 * @param {string|number} identifier 学生或班级业务标识。
 * @param {Set<string>} usedNameSet 当前层级已使用名称集合。
 * @returns {string} 当前层级唯一的路径名称。
 */
function buildUniquePathName(displayName, identifier, usedNameSet) {
  const baseName = cleanOriginalVolumePathName(displayName);
  if (!usedNameSet.has(baseName)) {
    usedNameSet.add(baseName);
    return baseName;
  }
  const identifierText =
    identifier === undefined || identifier === null
      ? String(usedNameSet.size + 1)
      : String(identifier);
  const suffix = cleanOriginalVolumePathName(identifierText);
  const buildCandidate = (index) => {
    const candidate = index === 1 ? `${baseName}_${suffix}` : `${baseName}_${suffix}_${index}`;
    return usedNameSet.has(candidate) ? buildCandidate(index + 1) : candidate;
  };
  const candidate = buildCandidate(1);
  usedNameSet.add(candidate);
  return candidate;
}

/**
 * 使用 XMLHttpRequest 读取原卷图片，避免依赖后端打包接口。
 * @param {string} imageUrl 原卷图片地址。
 * @returns {Promise<Blob>} 图片内容。
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
 * 获取或创建班级目录名称，保持同一班级只生成一个目录。
 * @param {object} context 当前 zip 构建上下文。
 * @param {object} student 学生数据。
 * @param {number} rowIndex 学生行序号。
 * @returns {string} 班级目录名称。
 */
function resolveGroupDirectory(context, student, rowIndex) {
  const groupKey = student.groupId
    ? `id:${student.groupId}`
    : `name:${cleanOriginalVolumePathName(student.groupName)}:${rowIndex}`;
  const existingGroupDirectory = context.groupDirectoryMap.get(groupKey);
  if (existingGroupDirectory) {
    return existingGroupDirectory;
  }
  const groupDirectory = buildUniquePathName(
    student.groupName,
    student.groupId,
    context.usedGroupNameSet,
  );
  context.groupDirectoryMap.set(groupKey, groupDirectory);
  return groupDirectory;
}

/**
 * 获取或创建学生目录名称，保持同一班级内重名学生不覆盖。
 * @param {object} context 当前 zip 构建上下文。
 * @param {object} student 学生数据。
 * @param {string} groupDirectory 班级目录名称。
 * @param {string} groupKey 班级目录缓存 key。
 * @param {number} rowIndex 学生行序号。
 * @returns {string} 学生目录名称。
 */
function resolveStudentDirectory(context, student, groupDirectory, groupKey, rowIndex) {
  if (!context.usedStudentNameSetMap.has(groupDirectory)) {
    context.usedStudentNameSetMap.set(groupDirectory, new Set());
  }
  const studentIdentifier = student.studentUserId || `row:${rowIndex}`;
  const studentKey = `${groupKey}:${studentIdentifier}`;
  const existingStudentDirectory = context.studentDirectoryMap.get(studentKey);
  if (existingStudentDirectory) {
    return existingStudentDirectory;
  }
  const studentDirectory = buildUniquePathName(
    student.studentName,
    student.studentUserId,
    context.usedStudentNameSetMap.get(groupDirectory),
  );
  context.studentDirectoryMap.set(studentKey, studentDirectory);
  return studentDirectory;
}

/**
 * 构建学生图片文件写入任务。
 * @param {object} options 写入参数。
 * @returns {Array<Promise<void>>} 图片写入任务列表。
 */
function buildStudentImageTasks(options) {
  const { student, studentFolder, studentDirectory, fetchImage } = options;
  return (student.studentExamPaperUrl || []).map((paperUrl, pageIndex) => {
    const pageNo = pageIndex + 1;
    const imageSuffix = resolveOriginalVolumeImageSuffix(paperUrl);
    const imageName = `${cleanOriginalVolumePathName(studentDirectory)}—第${pageNo}张${imageSuffix}`;
    return fetchImage(paperUrl)
      .then((imageBlob) => {
        studentFolder.file(imageName, imageBlob);
        return imageBlob;
      })
      .catch((error) => {
        return JSZip.external.Promise.reject(
          new Error(
            `学生【${student.studentName || DEFAULT_NAME}】第${pageNo}张图片读取失败，原因=${error?.message || "未知错误"}`,
          ),
        );
      });
  });
}

/**
 * 过滤学生得分列表中的汇总行，只保留真实学生。
 * @param {Array<object>} studentList 接口返回的学生得分列表。
 * @returns {Array<object>} 可导出的真实学生列表。
 */
function filterOriginalVolumeStudents(studentList) {
  return (studentList || []).filter((student) => student?.studentUserId);
}

/**
 * 找出缺少原卷图片的学生，提前失败可避免生成缺页 zip。
 * @param {Array<object>} students 可导出的真实学生列表。
 * @returns {object|undefined} 第一个缺少原卷图片的学生。
 */
function findStudentWithoutPaper(students) {
  return students.find((student) => {
    return (student.studentExamPaperUrl || []).length === 0;
  });
}

/**
 * 构建单个学生对应的图片写入任务列表。
 * @param {object} options 写入上下文。
 * @returns {Array<Promise<void>>} 当前学生图片写入任务列表。
 */
function buildStudentZipTasks(options) {
  const { rootDirectory, zip, context, student, index, fetchImage } = options;
  const rowIndex = index + 1;
  const groupKey = student.groupId
    ? `id:${student.groupId}`
    : `name:${cleanOriginalVolumePathName(student.groupName)}:${rowIndex}`;
  const groupDirectory = resolveGroupDirectory(context, student, rowIndex);
  const studentDirectory = resolveStudentDirectory(
    context,
    student,
    groupDirectory,
    groupKey,
    rowIndex,
  );
  const studentFolder = zip.folder(
    `${rootDirectory}${cleanOriginalVolumePathName(groupDirectory)}/${cleanOriginalVolumePathName(studentDirectory)}`,
  );
  return buildStudentImageTasks({
    student,
    studentFolder,
    studentDirectory,
    fetchImage,
  });
}

/**
 * 构建学生原卷 zip Blob，并返回浏览器下载所需文件名。
 * @param {object} options 打包参数。
 * @param {string} options.examName 测验名称。
 * @param {Array<object>} options.studentList 学生得分列表。
 * @param {Function} options.fetchImage 图片读取函数，测试可注入。
 * @returns {Promise<{fileName: string, blob: Blob}>} zip 文件名和内容。
 */
export async function buildOriginalVolumeZip(options) {
  const { examName, studentList, fetchImage = requestImageBlob } =
    options || {};
  const fileName = `${cleanOriginalVolumePathName(examName)}${ORIGINAL_VOLUME_SUFFIX}${ZIP_SUFFIX}`;
  const rootDirectory = `${cleanOriginalVolumePathName(examName)}${ORIGINAL_VOLUME_SUFFIX}/`;
  const students = filterOriginalVolumeStudents(studentList);
  if (students.length === 0) {
    return JSZip.external.Promise.reject(new Error("没有可导出的学生原卷"));
  }
  const studentWithoutPaper = findStudentWithoutPaper(students);
  if (studentWithoutPaper) {
    return JSZip.external.Promise.reject(
      new Error(`学生【${studentWithoutPaper.studentName || DEFAULT_NAME}】没有原卷图片`),
    );
  }
  const zip = new JSZip();
  zip.folder(rootDirectory);
  const context = {
    groupDirectoryMap: new Map(),
    studentDirectoryMap: new Map(),
    usedGroupNameSet: new Set(),
    usedStudentNameSetMap: new Map(),
  };
  const imageTasks = students
    .flatMap((student, index) => {
      return buildStudentZipTasks({
        rootDirectory,
        zip,
        context,
        student,
        index,
        fetchImage,
      });
    });

  await JSZip.external.Promise.all(imageTasks);
  const blob = await zip.generateAsync({ type: "blob" });
  return {
    fileName,
    blob,
  };
}

/**
 * 使用浏览器下载前端生成的原卷 zip。
 * @param {object} options 下载参数。
 * @param {string} options.fileName zip 文件名。
 * @param {Blob} options.blob zip 内容。
 * @returns {void}
 */
export function downloadOriginalVolumeZip({ fileName, blob }) {
  const objectUrlApi = window["URL"];
  const downloadUrl = objectUrlApi.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  objectUrlApi.revokeObjectURL(downloadUrl);
}
