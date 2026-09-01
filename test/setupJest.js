/* eslint-disable unicorn/filename-case, unicorn/no-null */
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = function matchMedia(query) {
    return {
      addListener: function addListener() {},
      dispatchEvent: function dispatchEvent() {
        return false;
      },
      matches: false,
      media: query,
      onchange: null,
      removeListener: function removeListener() {},
    };
  };
}

if (typeof window !== "undefined" && !window.scrollTo) {
  window.scrollTo = function scrollTo() {};
}

if (typeof window !== "undefined" && !window.URL.createObjectURL) {
  window.URL.createObjectURL = function createObjectURL() {
    return "blob:test-object-url";
  };
}
