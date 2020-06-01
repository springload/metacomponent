const LOCAL_STORAGE = "LOCAL_STORAGE" as const;
type LOCAL_STORAGE_TYPE = typeof LOCAL_STORAGE;

/*
 *  DEVELOPER NOTE
 *
 *  Some browsers can block storage (localStorage, sessionStorage)
 *  access for privacy reasons, and all browsers can have storage
 *  that's full, and so they'll throw exceptions.
 *
 *  These exceptions can happen even with `if (window.localStorage)`!
 *
 *  Also sometimes localStorage/sessionStorage are enabled
 *  AFTER page load on mobiles. This is a browser bug we need to
 *  handle it gracefully.
 *
 *  So,
 *
 *****************************************************************
 *           we need to wrap all usage in try/catch
 *****************************************************************
 *
 *  and,
 *
 ****************************************************************
 *     we need to defer actual usage of these until necessary,
 *    hence using CONSTANTS to indirectly refer to these storages
 *     rather than window.localStorage/window.sessionStorage
 *                         directly
 ****************************************************************
 */

const storage = (STORAGE_TYPE: LOCAL_STORAGE_TYPE) => ({
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") return; // exit early for SSR
    try {
      STORAGE_TYPE === LOCAL_STORAGE
        ? window.localStorage.setItem(key, value)
        : window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.log(e);
    }
  },
  getItem: (key: string) => {
    if (typeof window === "undefined") return; // exit early for SSR
    try {
      return STORAGE_TYPE === LOCAL_STORAGE
        ? window.localStorage.getItem(key)
        : window.sessionStorage.getItem(key);
    } catch (e) {
      console.log(e);
    }
  },
  removeItem: (key: string) => {
    try {
      STORAGE_TYPE === LOCAL_STORAGE
        ? window.localStorage.removeItem(key)
        : window.sessionStorage.removeItem(key);
    } catch (e) {
      console.log(e);
    }
  },
});

export const localStorageWrapper = storage(LOCAL_STORAGE);
