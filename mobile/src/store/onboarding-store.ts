import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'cuidapp.onboarding.v1';

interface OnboardingState {
  visto: Record<string, boolean>;
  version: number;
  marcarVisto: (clave: string) => void;
  yaVisto: (clave: string) => boolean;
  resetear: () => void;
}

const ESTADO_INICIAL: Omit<OnboardingState, 'marcarVisto' | 'yaVisto' | 'resetear'> = {
  visto: {},
  version: 1,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...ESTADO_INICIAL,
      
      marcarVisto: (clave: string) => {
        if (get().visto[clave]) return;
        set((state) => ({
          visto: { ...state.visto, [clave]: true },
        }));
      },
      
      yaVisto: (clave: string) => {
        return get().visto[clave] === true;
      },
      
      resetear: () => {
        set({ ...ESTADO_INICIAL });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      })),
      partialize: (state) => ({ visto: state.visto, version: state.version }),
    }
  )
);