import { api } from "@/lib/api";
import { useApiQuery } from "../typed-query";
import { useApiMutation } from "../typed-mutation";
import { publicApi } from "../public-api";
import { useQueryClient } from "@tanstack/react-query";

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

export interface ExecuteCodeRequest {
  code: string;
  language: "javascript" | "python" | "java";
}

export interface ExecuteCodeResponse {
  success: boolean;
  consoleOutput?: {
    input: string;
    output: string | null;
    error: string | null;
    status: string;
    time?: number;
    memory?: number;
  };
  submission?: {
    testCases: Array<{
      status: "PASSED" | "FAILED";
      input: string;
      expectedOutput: string;
      actualOutput?: string;
      error?: string;
      executionTime?: number;
      memory?: number;
      statusDescription?: string;
    }>;
  };
  isCustomInput?: boolean;
  error?: string;
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
    const response = await publicApi.get(`/problems/${id}`);
    return response.data;
  },
  executeCode: async (problemId: string, payload: ExecuteCodeRequest) => {
    const response = await api.post<ExecuteCodeResponse>(
      `/problems/${problemId}/execute`,
      payload
    );
    return response.data;
  },
  submitExecuteCode: async (problemId: string, payload: ExecuteCodeRequest) => {
    const response = await api.post<ExecuteCodeResponse>(
      `/problems/${problemId}/submit`,
      payload
    );
    return response.data;
  },

  getAllSubmissions: async (problemId: string) => {
    const response = await api.get("/problems/submissions", {
      params: { problemId },
    });
    return response.data;
  },

  createPlayList: async (data: { name: string; description?: string }) => {
    const response = await api.post("/problems/playlists", data);
    return response.data;
  },

  getPlayLists: async () => {
    const response = await api.get("/problems/playlists");
    return response.data;
  },
  addToPlayList: async (playlistId: string, problemId: string) => {
    const response = await api.post(`/problems/playlists/add-problem`, {
      playlistId,
      problemId,
    });
    return response.data;
  },
  deletePlayList: async (playlistId: string) => {
    const response = await api.delete(`/problems/playlists/${playlistId}`);
    return response.data;
  },
  removeFromPlayList: async (playlistId: string, problemId: string) => {
    const response = await api.delete(
      `/problems/playlists/remove-problem/${playlistId}/${problemId}`
    );
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
  return useApiQuery({
    queryKey: ["problems", id],
    queryFn: () => problemsApi.getProblemById(id),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetPlayLists() {
  return useApiQuery({
    queryKey: ["playlists"],
    queryFn: () => problemsApi.getPlayLists(),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetProblemsSubmissions(problemId: string) {
  return useApiQuery({
    queryKey: ["problems", problemId, "submissions"],
    queryFn: () => problemsApi.getAllSubmissions(problemId),
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

export function useExecuteCode(problemId: string) {
  return useApiMutation({
    mutationFn: (payload: ExecuteCodeRequest) =>
      problemsApi.executeCode(problemId, payload),
    retry: 0,
  });
}

export function useSubmitExecuteCode(problemId: string) {
  return useApiMutation({
    mutationFn: (payload: ExecuteCodeRequest) =>
      problemsApi.submitExecuteCode(problemId, payload),
    retry: 0,
  });
}

export function useCreatePlayList() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      problemsApi.createPlayList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    retry: 0,
  });
}

export function useAddToPlayList() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: { playlistId: string; problemId: string }) =>
      problemsApi.addToPlayList(data.playlistId, data.problemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    retry: 0,
  });
}

export function useDeletePlayList() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (playlistId: string) => problemsApi.deletePlayList(playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    retry: 0,
  });
}

export function useRemoveFromPlayList() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: { playlistId: string; problemId: string }) =>
      problemsApi.removeFromPlayList(data.playlistId, data.problemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    retry: 0,
  });
}
