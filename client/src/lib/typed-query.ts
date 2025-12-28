import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ApiAxiosError } from "./api-error";

export function useApiQuery<TData>(
  options: UseQueryOptions<TData, ApiAxiosError>
) {
  return useQuery<TData, ApiAxiosError>(options);
}
