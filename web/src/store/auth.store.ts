import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  rememberMe: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, rememberMe: boolean) => void;
  setAccessToken: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      rememberMe: false,
      setAuth: (user, accessToken, refreshToken, rememberMe) =>
        set({ user, accessToken, refreshToken, rememberMe }),
      setAccessToken: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken }),
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, rememberMe: false });
        localStorage.removeItem("auth-storage");
      },
    }),
    {
      name: "auth-storage",
    }
  )
);