import { storageService } from './storageService';

export const TOKEN_KEY = 'varchlearn_jwt_token_v1';

export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1',
  // Integrated mode by default; set EXPO_PUBLIC_USE_MOCK_API=true only for offline mock demo
  useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API === 'true',
  timeoutMs: 10000,
};

export async function simulatedDelay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await storageService.getItem<string>(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}
