const SESSION_ID_KEY = "sessionId";
const SESSION_OWNER_NAME_PREFIX = "question-test-session-owner:";
const SESSION_OWNER_STORAGE_PREFIX = "question-test-session-owner:";
const SESSION_OWNER_TTL = 43_200_000;
const RANDOM_WORD_COUNT = 4;
const HEX_RADIX = 16;
const HEX_CHUNK_LENGTH = 8;
const FALLBACK_RANDOM_SCALE = 4_294_967_296;
const PAD_CHAR = "0";

const toFixedHex = (value) =>
  Number(value || 0)
    .toString(HEX_RADIX)
    .padStart(HEX_CHUNK_LENGTH, PAD_CHAR);

export const createSessionId = (
  randomSource = typeof window === "undefined" ? undefined : window.crypto,
) => {
  if (typeof randomSource?.randomUUID === "function") {
    return randomSource.randomUUID();
  }

  if (typeof randomSource?.getRandomValues === "function") {
    const values = randomSource.getRandomValues(
      new Uint32Array(RANDOM_WORD_COUNT),
    );

    return `session-${[...values].map((value) => toFixedHex(value)).join("")}`;
  }

  return `session-${Date.now().toString(HEX_RADIX)}-${toFixedHex(
    Math.floor(Math.random() * FALLBACK_RANDOM_SCALE),
  )}`;
};

const getSessionOwnerKey = (sessionId) =>
  `${SESSION_OWNER_STORAGE_PREFIX}${sessionId}`;

const parseOwnerRecord = (recordText) => {
  try {
    return recordText ? JSON.parse(recordText) : undefined;
  } catch {
    return;
  }
};

const getWindowOwnerId = (windowObject, randomSource) => {
  if (!windowObject || typeof windowObject.name !== "string") {
    return;
  }

  if (windowObject.name.startsWith(SESSION_OWNER_NAME_PREFIX)) {
    return windowObject.name.slice(SESSION_OWNER_NAME_PREFIX.length);
  }

  if (windowObject.name) {
    return;
  }

  const ownerId = createSessionId(randomSource);
  windowObject.name = `${SESSION_OWNER_NAME_PREFIX}${ownerId}`;
  return ownerId;
};

const isOwnedByAnotherLiveWindow = (sessionId, ownerId, sharedStorage, now) => {
  if (!sessionId || !ownerId || !sharedStorage) {
    return false;
  }

  const ownerRecord = parseOwnerRecord(
    sharedStorage.getItem(getSessionOwnerKey(sessionId)),
  );

  if (!ownerRecord || ownerRecord.ownerId === ownerId) {
    return false;
  }

  return now - Number(ownerRecord.updatedAt || 0) < SESSION_OWNER_TTL;
};

const markSessionOwner = (sessionId, ownerId, sharedStorage, now) => {
  if (!sessionId || !ownerId || !sharedStorage) {
    return;
  }

  sharedStorage.setItem(
    getSessionOwnerKey(sessionId),
    JSON.stringify({
      ownerId,
      updatedAt: now,
    }),
  );
};

export const ensureSessionId = (
  storage = typeof window === "undefined" ? undefined : window.sessionStorage,
  randomSource = typeof window === "undefined" ? undefined : window.crypto,
  windowObject = typeof window === "undefined" ? undefined : window,
  sharedStorage = typeof window === "undefined"
    ? undefined
    : window.localStorage,
  now = Date.now(),
) => {
  const currentSessionId = storage?.getItem(SESSION_ID_KEY);
  const ownerId = getWindowOwnerId(windowObject, randomSource);

  if (
    currentSessionId &&
    !isOwnedByAnotherLiveWindow(currentSessionId, ownerId, sharedStorage, now)
  ) {
    markSessionOwner(currentSessionId, ownerId, sharedStorage, now);
    return currentSessionId;
  }

  // 浏览器新开窗口可能复制 sessionStorage，发现同 tabId 被活跃窗口占用时重建当前窗口 tabId。
  const nextSessionId = createSessionId(randomSource);
  storage?.setItem(SESSION_ID_KEY, nextSessionId);
  markSessionOwner(nextSessionId, ownerId, sharedStorage, now);
  return nextSessionId;
};
