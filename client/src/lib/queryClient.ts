import { QueryClient } from '@tanstack/react-query';
import type { ApiAxiosError } from './api-error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry auth errors
        const err = error as ApiAxiosError;
        if (err?.response?.status === 401) return false;

        return failureCount < 2;
      },

      staleTime: 1000 * 60, // 1 min
      refetchOnWindowFocus: false,
    },

    mutations: {
      retry: false,
    },
  },
});
