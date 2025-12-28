import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { ApiAxiosError } from '@/lib/api-error';

export function useApiMutation<TData, TVariables>(
  options: UseMutationOptions<TData, ApiAxiosError, TVariables>
) {
  return useMutation<TData, ApiAxiosError, TVariables>(options);
}
