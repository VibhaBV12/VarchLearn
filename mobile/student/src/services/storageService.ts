import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryFallback: Record<string, string> = {};

export const storageService = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // Fallback to in-memory store if AsyncStorage is unavailable in web/test
    }
    return memoryFallback[key] ? (JSON.parse(memoryFallback[key]) as T) : null;
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    memoryFallback[key] = serialized;
    try {
      await AsyncStorage.setItem(key, serialized);
    } catch {
      // Ignore storage error in restricted environments
    }
  },

  async removeItem(key: string): Promise<void> {
    delete memoryFallback[key];
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};
