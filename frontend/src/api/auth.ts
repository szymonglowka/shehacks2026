import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { clearTokens, setTokens } from './token-storage';
import { meKey } from './me';

interface TokenPair {
  access: string;
  refresh: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  display_name: string;
  language: 'pl' | 'en';
  health_data_consent: boolean;
}

async function loginRequest(input: LoginInput): Promise<TokenPair> {
  return api<TokenPair>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(input),
  });
}

async function registerRequest(input: RegisterInput): Promise<TokenPair> {
  return api<TokenPair>('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(input),
  });
}

function useStoreTokens() {
  const queryClient = useQueryClient();
  return (tokens: TokenPair) => {
    setTokens(tokens.access, tokens.refresh);
    void queryClient.invalidateQueries({ queryKey: meKey });
  };
}

export function useLogin() {
  const store = useStoreTokens();
  return useMutation({
    mutationFn: (input: LoginInput) => loginRequest(input),
    onSuccess: store,
  });
}

export function useRegister() {
  const store = useStoreTokens();
  return useMutation({
    mutationFn: (input: RegisterInput) => registerRequest(input),
    onSuccess: store,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    clearTokens();
    queryClient.clear();
    window.location.href = '/welcome';
  };
}
