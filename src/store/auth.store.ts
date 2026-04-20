import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth';
import { apiConfig, clearAuthSession, getAuthToken } from '../config/api';

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  bootstrap: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const raw = localStorage.getItem(apiConfig.storage.profileKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      clearAuthSession();
      return null;
    }
  })(),
  isAuthenticated: !!getAuthToken(),
  isBootstrapping: true,

  login: async (payload) => {
    const data = await authService.login(payload);
    localStorage.setItem(apiConfig.storage.tokenKey, data.token);
    localStorage.setItem(apiConfig.storage.profileKey, JSON.stringify(data.user));
    localStorage.setItem(
      apiConfig.storage.sessionStartedAtKey,
      new Date().toISOString(),
    );
    set({ user: data.user, isAuthenticated: true, isBootstrapping: false });
  },

  register: async (payload) => {
    const data = await authService.register(payload);
    localStorage.setItem(apiConfig.storage.tokenKey, data.token);
    localStorage.setItem(apiConfig.storage.profileKey, JSON.stringify(data.user));
    localStorage.setItem(
      apiConfig.storage.sessionStartedAtKey,
      new Date().toISOString(),
    );
    set({ user: data.user, isAuthenticated: true, isBootstrapping: false });
  },

  bootstrap: async () => {
    if (!getAuthToken()) {
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
      return;
    }

    try {
      const profile = await authService.getProfile();
      localStorage.setItem(apiConfig.storage.profileKey, JSON.stringify(profile));
      if (!localStorage.getItem(apiConfig.storage.sessionStartedAtKey)) {
        localStorage.setItem(
          apiConfig.storage.sessionStartedAtKey,
          new Date().toISOString(),
        );
      }
      set({ user: profile, isAuthenticated: true, isBootstrapping: false });
    } catch {
      clearAuthSession();
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
    }
  },

  logout: () => {
    clearAuthSession();
    set({ user: null, isAuthenticated: false, isBootstrapping: false });
  },
}));
