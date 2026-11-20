import axios from 'axios';
import api from './api';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RecoverAccountRequest {
  username: string;
  recovery_key: string;
  new_username?: string;
  new_password?: string;
}

export interface RecoverAccountResponse {
  user: { id: string; username: string; role: string };
  recovery_keys_remaining: number;
}

export async function recoverAccount(request: RecoverAccountRequest) {
  const response = await publicApi.post<RecoverAccountResponse>('/auth/recover', request);
  return response.data;
}

export async function regenerateRecoveryKeys(password: string) {
  const response = await api.post<{ recovery_keys: string[] }>('/auth/recovery-keys', { password });
  return response.data.recovery_keys;
}
