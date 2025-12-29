import { api } from "@/lib/api";
import { useApiQuery } from "../typed-query";
import { useApiMutation } from "../typed-mutation";
import { publicApi } from "../public-api";

export interface Problem {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
}

export interface ProblemById{

}

export interface GetProblemsParams {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  tags?: string[];
  sortBy?: "createdAt" | "title" | "difficulty";
  order?: "asc" | "desc";
}

export interface GetProblemsResponse {
  success: boolean;
  data: Problem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const problemsApi = {
  getAllProblems: async (params: GetProblemsParams = {}) => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(","));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    const response = await publicApi.get<GetProblemsResponse>(
      `/problems${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    );
    return response.data;
  },

  deleteProblem: async (id: string) => {
    const response = await api.delete(`/problems/${id}`);
    return response.data;
  },

  getProblemById: async (id: string) => {
    const response = await publicApi.get<ProblemById>(`/problems/${id}`);
    return response.data;
  },
};

export function useProblems(params: GetProblemsParams = {}) {
  return useApiQuery<GetProblemsResponse>({
    queryKey: ["problems", params],
    queryFn: () => problemsApi.getAllProblems(params),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProblemById(id: string) {
  return useApiQuery<ProblemById>({
    queryKey: ["problems", id],
    queryFn: () => problemsApi.getProblemById(id),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDeleteProblem() {
  return useApiMutation({
    mutationFn: (id: string) => problemsApi.deleteProblem(id),
    retry: 1,
  });
}
