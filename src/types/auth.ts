export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthBackendStatus {
  status: 'CONNECTED' | 'NOT CONNECTED / CONFIGURATION REQUIRED';
  dialect: string;
  connectionConfigured: boolean;
  missingConfig?: string[];
  database?: string;
  latencyMs?: number;
  message: string;
  activeStorage: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  expiresAt: string;
  backendStatus: AuthBackendStatus;
}

export interface SessionResponse {
  user: User;
  backendStatus: AuthBackendStatus;
}
