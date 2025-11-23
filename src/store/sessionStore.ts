import { create } from 'zustand';
import { getSecretKey } from '@/lib/api/aes';

interface SessionState {
  isLoggedIn: boolean;
  email: string | null;
  isAdmin: boolean;
  permissions: string[];
  isPinSet: boolean;
  isPinVerified: boolean;
  secretKey: string | null;
  isLoading: boolean;
  
  login: (data: {
    email: string;
    isAdmin: boolean;
    permissions: string[];
    isPinSet: boolean;
  }) => void;
  logout: () => void;
  setPinVerified: (verified: boolean) => void;
  setSecretKey: (key: string) => void;
  setLoading: (loading: boolean) => void;
  updatePermissions: (permissions: string[]) => void;
  fetchAndSetSecretKey: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()((set) => ({
  isLoggedIn: false,
  email: null,
  isAdmin: false,
  permissions: [],
  isPinSet: false,
  isPinVerified: false,
  secretKey: null,
  isLoading: false,

  login: (data) => set({
    isLoggedIn: true,
    email: data.email,
    isAdmin: data.isAdmin,
    permissions: data.permissions,
    isPinSet: data.isPinSet,
    isPinVerified: false,
  }),

  logout: () => set({
    isLoggedIn: false,
    email: null,
    isAdmin: false,
    permissions: [],
    isPinSet: false,
    isPinVerified: false,
    secretKey: null,
    isLoading: false,
  }),

  setPinVerified: (verified) => set({
    isPinSet: true,
    isPinVerified: verified,
  }),

  setSecretKey: (key) => set({ secretKey: key }),

  setLoading: (loading) => set({ isLoading: loading }),

  updatePermissions: (permissions) => set({ permissions }),

  fetchAndSetSecretKey: async () => {
    try {
      const key = await getSecretKey();
      set({ secretKey: key });
    } catch (error) {
      console.error('Failed to fetch secret key:', error);
    }
  },
}));

