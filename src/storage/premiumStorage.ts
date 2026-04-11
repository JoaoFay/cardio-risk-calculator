import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'labia:premium';

export async function isPremium(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === 'true';
  } catch {
    return false;
  }
}
