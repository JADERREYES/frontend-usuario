import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth';

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
    const raw = localStorage.getItem('user_profile');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  })(),
  isAuthenticated: !!localStorage.getItem('user_token'),
  isBootstrapping: true,

  login: async (payload) => {
    const data = await authService.login(payload);
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_profile', JSON.stringify(data.user));
    localStorage.setItem('user_session_started_at', new Date().toISOString());
    set({ user: data.user, isAuthenticated: true, isBootstrapping: false });
  },

  register: async (payload) => {
    const data = await authService.register(payload);
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_profile', JSON.stringify(data.user));
    localStorage.setItem('user_session_started_at', new Date().toISOString());
    set({ user: data.user, isAuthenticated: true, isBootstrapping: false });
  },

  bootstrap: async () => {
    if (!localStorage.getItem('user_token')) {
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
      return;
    }

    try {
      const profile = await authService.getProfile();
      localStorage.setItem('user_profile', JSON.stringify(profile));
      if (!localStorage.getItem('user_session_started_at')) {
        localStorage.setItem('user_session_started_at', new Date().toISOString());
      }
      set({ user: profile, isAuthenticated: true, isBootstrapping: false });
    } catch {
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_profile');
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
    }
  },

  logout: () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('user_session_started_at');
    set({ user: null, isAuthenticated: false, isBootstrapping: false });
  },
}));
