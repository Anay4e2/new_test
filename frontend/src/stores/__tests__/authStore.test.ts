import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock API module
vi.mock('../../services/api', () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  adminLoginUser: vi.fn(),
  getCurrentUser: vi.fn(),
  googleAuthApi: vi.fn(),
}));

import { useAuthStore } from '../authStore';
import { loginUser, registerUser } from '../../services/api';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should initialize with null user and token', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      success: true,
      token: 'jwt-token-123',
      user: { id: '1', name: 'Test', email: 'test@test.com', role: 'user', createdAt: '2025-01-01' },
    };
    (loginUser as any).mockResolvedValue(mockResponse);

    const result = await useAuthStore.getState().login('test@test.com', 'password');

    expect(result).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockResponse.user);
    expect(useAuthStore.getState().token).toBe('jwt-token-123');
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('should handle login failure', async () => {
    (loginUser as any).mockResolvedValue({ success: false, message: 'Invalid credentials' });

    const result = await useAuthStore.getState().login('wrong@test.com', 'wrong');

    expect(result).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
  });

  it('should register successfully', async () => {
    const mockResponse = {
      success: true,
      token: 'jwt-reg-token',
      user: { id: '2', name: 'New User', email: 'new@test.com', role: 'user', createdAt: '2025-01-01' },
    };
    (registerUser as any).mockResolvedValue(mockResponse);

    const result = await useAuthStore.getState().register('New User', 'new@test.com', 'password123');

    expect(result).toBe(true);
    expect(useAuthStore.getState().user?.name).toBe('New User');
    expect(useAuthStore.getState().token).toBe('jwt-reg-token');
  });

  it('should logout', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', email: 'test@test.com', createdAt: '2025-01-01' },
      token: 'some-token',
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('isAuthenticated should return true when logged in', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test', email: 'test@test.com', createdAt: '2025-01-01' },
      token: 'token',
    });

    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('isAuthenticated should return false when logged out', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it('clearError should reset error state', () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
