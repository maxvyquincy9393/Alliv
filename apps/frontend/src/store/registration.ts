import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RegistrationData } from '../types/profile';

interface RegistrationStore {
  data: Partial<RegistrationData>;
  currentStep: number;
  setData: (data: Partial<RegistrationData>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialData: Partial<RegistrationData> = {
  acceptedRules: false,
  verified: false,
  name: '',
  email: '',
  birthday: '',
  gender: undefined,
  city: '',
  bio: '',
  goals: '',
  photos: [],
  field: '',
  skills: [],
  interests: [],
  location: undefined,
};

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      data: initialData,
      currentStep: 0,

      setData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),

      setStep: (step) => set({ currentStep: step }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 8),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),

      reset: () =>
        set({
          data: initialData,
          currentStep: 0,
        }),
    }),
    {
      name: 'alliv-registration',
    }
  )
);
