import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FastingPlan {
  id: number;
  name: string;
  fastingHours: number;
  eatingHours: number;
}

const PLANS_STORAGE_KEY = 'fastingPlans';
const ACTIVE_PLAN_ID_STORAGE_KEY = 'activePlanId';

export const loadFastingPlans = async (): Promise<{ plans: FastingPlan[]; activePlanId: number }> => {
  let plansString = await AsyncStorage.getItem(PLANS_STORAGE_KEY);
  let activeIdString = await AsyncStorage.getItem(ACTIVE_PLAN_ID_STORAGE_KEY);

  if (!plansString) {
    const defaultPlan: FastingPlan = { id: 1, name: '16:8 Leangains', fastingHours: 16, eatingHours: 8 };
    const defaultPlans = [defaultPlan];
    await AsyncStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(defaultPlans));
    await AsyncStorage.setItem(ACTIVE_PLAN_ID_STORAGE_KEY, '1');
    return { plans: defaultPlans, activePlanId: 1 };
  } else {
    const plans: FastingPlan[] = JSON.parse(plansString);
    const activePlanId = activeIdString ? parseInt(activeIdString, 10) : (plans.length > 0 ? plans[0].id : 1);
    return { plans, activePlanId };
  }
};

export const saveFastingPlans = async (plans: FastingPlan[]): Promise<void> => {
  await AsyncStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
};

export const setActiveFastingPlan = async (planId: number): Promise<void> => {
  await AsyncStorage.setItem(ACTIVE_PLAN_ID_STORAGE_KEY, String(planId));
};

export const getNextPlanId = (plans: FastingPlan[]): number => {
  if (plans.length === 0) return 1;
  return Math.max(...plans.map(p => p.id)) + 1;
};