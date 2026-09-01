import { createSessionId, ensureSessionId } from "./sessionId";

const SESSION_ID_KEY = "sessionId";
const EXISTING_SESSION_ID = "existing-session";
const NEW_SESSION_ID = "new-session";
const OWNER_PREFIX = "question-test-session-owner:";
const EXISTING_SESSION_OWNER_KEY = `${OWNER_PREFIX}${EXISTING_SESSION_ID}`;

const createStorage = (initialValue) => {
  const values = initialValue ? { [SESSION_ID_KEY]: initialValue } : {};

  return {
    getItem: (key) => values[key],
    setItem: (key, value) => {
      values[key] = value;
    },
  };
};

const createSharedStorage = (initialValues = {}) => {
  const values = { ...initialValues };

  return {
    getItem: (key) => values[key],
    setItem: (key, value) => {
      values[key] = value;
    },
  };
};

describe("sessionId", () => {
  it("keeps an existing session id", () => {
    const storage = createStorage(EXISTING_SESSION_ID);

    expect(
      ensureSessionId(storage, {
        randomUUID: (value = NEW_SESSION_ID) => value,
      }),
    ).toBe(EXISTING_SESSION_ID);
  });

  it("uses getRandomValues when randomUUID is unavailable", () => {
    const storage = createStorage();
    const sessionId = ensureSessionId(storage, {
      getRandomValues: (values) => {
        values.set([1, 2, 3, 4]);
        return values;
      },
    });

    expect(sessionId).toBe("session-00000001000000020000000300000004");
    expect(storage.getItem(SESSION_ID_KEY)).toBe(sessionId);
  });

  it("keeps a session id owned by the current browser window", () => {
    const storage = createStorage(EXISTING_SESSION_ID);
    const sharedStorage = createSharedStorage({
      [EXISTING_SESSION_OWNER_KEY]: JSON.stringify({
        ownerId: "owner-1",
        updatedAt: 100,
      }),
    });

    expect(
      ensureSessionId(
        storage,
        {
          randomUUID: (value = NEW_SESSION_ID) => value,
        },
        {
          name: `${OWNER_PREFIX}owner-1`,
        },
        sharedStorage,
        200,
      ),
    ).toBe(EXISTING_SESSION_ID);
  });

  it("rebuilds a copied session id owned by another live browser window", () => {
    const storage = createStorage("copied-session");
    const sharedStorage = createSharedStorage({
      [`${OWNER_PREFIX}copied-session`]: JSON.stringify({
        ownerId: "owner-1",
        updatedAt: 100,
      }),
    });
    const windowObject = { name: "" };
    const randomUUID = jest
      .fn()
      .mockReturnValueOnce("owner-2")
      .mockReturnValueOnce("new-session");

    expect(
      ensureSessionId(
        storage,
        {
          randomUUID,
        },
        windowObject,
        sharedStorage,
        200,
      ),
    ).toBe(NEW_SESSION_ID);
    expect(storage.getItem(SESSION_ID_KEY)).toBe(NEW_SESSION_ID);
    expect(windowObject.name).toBe(`${OWNER_PREFIX}owner-2`);
  });

  it("falls back without browser crypto support", () => {
    expect(createSessionId()).toEqual(expect.stringMatching(/^session-/));
  });
});
