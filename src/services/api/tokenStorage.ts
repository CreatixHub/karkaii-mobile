import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthUser } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'karkaii_access_token';
const REFRESH_TOKEN_KEY = 'karkaii_refresh_token';
const USER_DATA_KEY = 'karkaii_user_data';
const REMEMBERED_EMAIL_KEY = 'karkaii_remembered_email';

// Web memory fallback if running in a web browser where SecureStore isn't native
const webStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch {}
  },
};

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[TokenStorage] Error reading ${key} from SecureStore:`, error);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`[TokenStorage] Error writing ${key} to SecureStore:`, error);
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[TokenStorage] Error deleting ${key} from SecureStore:`, error);
  }
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  async clearTokens(): Promise<void> {
    await deleteItem(ACCESS_TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
    await deleteItem(USER_DATA_KEY);
  },

  async getStoredUser(): Promise<AuthUser | null> {
    const raw = await getItem(USER_DATA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  async setStoredUser(user: AuthUser | null): Promise<void> {
    if (!user) {
      await deleteItem(USER_DATA_KEY);
    } else {
      await setItem(USER_DATA_KEY, JSON.stringify(user));
    }
  },

  async getRememberedEmail(): Promise<string | null> {
    return getItem(REMEMBERED_EMAIL_KEY);
  },

  async setRememberedEmail(email: string | null): Promise<void> {
    if (!email) {
      await deleteItem(REMEMBERED_EMAIL_KEY);
    } else {
      await setItem(REMEMBERED_EMAIL_KEY, email);
    }
  },
};
