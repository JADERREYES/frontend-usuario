import { create } from 'zustand';

type UiState = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'home',
  setActiveTab: (activeTab) => set({ activeTab }),
}));
