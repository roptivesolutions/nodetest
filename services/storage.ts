
const STORAGE_KEY_PREFIX = 'attendify_';

export const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set: <T,>(key: string, value: T): void => {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  }
};
