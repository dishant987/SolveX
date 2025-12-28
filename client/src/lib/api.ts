import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: (() => void)[] = [];

const processQueue = () => {
  refreshQueue.forEach((cb) => cb());
  refreshQueue = [];
};

const AUTH_EXCLUDED_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosError["config"] & { _retry?: boolean })
      | undefined;

    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const isAuthRoute = AUTH_EXCLUDED_ROUTES.some((route) =>
      originalRequest.url?.includes(route)
    );

    // ❌ DO NOT refresh on auth routes
    if (error.response.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        // ✅ Hard logout
        window.location.replace("/login");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
