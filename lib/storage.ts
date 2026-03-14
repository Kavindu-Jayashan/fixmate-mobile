/**
 * Native storage implementation using AsyncStorage.
 * Metro automatically selects this file when platform=ios/android.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const storage = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

export default storage;
