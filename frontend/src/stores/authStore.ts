import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { registerUser, loginUser, getCurrentUser } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    register: (name: string, email: string, password: string) => Promise<boolean>;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    fetchCurrentUser: () => Promise<void>;
    clearError: () => void;

    // Computed
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            register: async (name: string, email: string, password: string): Promise<boolean> => {
                set({ isLoading: true, error: null });
                try {
                    const response = await registerUser(name, email, password);
                    if (response.success) {
                        set({
                            user: response.user,
                            token: response.token,
                            isLoading: false,
                            error: null
                        });
                        return true;
                    } else {
                        set({ isLoading: false, error: response.message || 'Registration failed' });
                        return false;
                    }
                } catch (error: any) {
                    const message = error.response?.data?.message || 'Registration failed';
                    set({ isLoading: false, error: message });
                    return false;
                }
            },

            login: async (email: string, password: string): Promise<boolean> => {
                set({ isLoading: true, error: null });
                try {
                    const response = await loginUser(email, password);
                    if (response.success) {
                        set({
                            user: response.user,
                            token: response.token,
                            isLoading: false,
                            error: null
                        });
                        return true;
                    } else {
                        set({ isLoading: false, error: response.message || 'Login failed' });
                        return false;
                    }
                } catch (error: any) {
                    const message = error.response?.data?.message || 'Login failed';
                    set({ isLoading: false, error: message });
                    return false;
                }
            },

            logout: () => {
                set({ user: null, token: null, error: null });
            },

            fetchCurrentUser: async () => {
                const token = get().token;
                if (!token) return;

                try {
                    const response = await getCurrentUser();
                    if (response.success) {
                        set({ user: response.user });
                    }
                } catch (error) {
                    // Token might be expired
                    set({ user: null, token: null });
                }
            },

            clearError: () => {
                set({ error: null });
            },

            isAuthenticated: () => {
                return get().token !== null && get().user !== null;
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user })
        }
    )
);
