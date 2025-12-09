import AsyncStorage from '@react-native-async-storage/async-storage';

export type FastingStatus = 'completed' | 'extended' | 'nearly_there' | 'aborted';

export interface FastingEntry {
  id: number;
  startTime: number;
  duration: number; // in seconds
  status: FastingStatus;
  plan: {
    name: string;
    fastingHours: number;
  };
}

const HISTORY_STORAGE_KEY = 'fastingHistory';

export const loadFastingHistory = async (): Promise<FastingEntry[]> => {
  const historyString = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
  return historyString ? JSON.parse(historyString) : [];
};

export const saveFastingHistory = async (history: FastingEntry[]): Promise<void> => {
  await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};

export const clearFastingHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
};