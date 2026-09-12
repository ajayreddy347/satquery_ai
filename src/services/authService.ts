import { User, AuthBackendStatus, AuthResponse, SessionResponse } from '../types/auth';

const TOKEN_KEY = 'satquery_auth_session_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn('Could not store auth token in localStorage', err);
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn('Could not remove auth token from localStorage', err);
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Authentication failed. Please check your credentials.');
  }

  if (data.token) {
    setStoredToken(data.token);
  }

  return data;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create account.');
  }

  if (data.token) {
    setStoredToken(data.token);
  }

  return data;
}

export async function getCurrentSession(): Promise<SessionResponse | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      removeStoredToken();
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('Error verifying session:', err);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  const token = getStoredToken();
  removeStoredToken();

  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });
    } catch {
      // Ignored
    }
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Password reset request failed.');
  }

  return data;
}

export async function getAuthBackendStatus(): Promise<AuthBackendStatus> {
  try {
    const response = await fetch('/api/auth/status');
    if (!response.ok) {
      throw new Error('Failed to retrieve authentication status');
    }
    return await response.json();
  } catch {
    return {
      status: 'NOT CONNECTED / CONFIGURATION REQUIRED',
      dialect: 'Local Server Container Storage',
      connectionConfigured: false,
      message: 'Database connection check failed. Operating in local container storage.',
      activeStorage: 'Local Server Container Storage',
    };
  }
}
