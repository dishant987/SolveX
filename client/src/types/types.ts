export type Permission = "ADMIN" | "USER";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  role: Permission;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;

  loading: boolean;
  setAuthStatus: React.Dispatch<
    React.SetStateAction<"loading" | "authenticated" | "unauthenticated">
  >;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  hasRole: (role: Permission) => boolean;
}

export type RouterContext = {
  auth?: {
    user?: User | null;
    hasRole: (role: Permission) => boolean;
    fetchUser: () => Promise<void>;
    loading: boolean;
  };
};

export interface LoginResponse {
  user: User;
}

export interface RegisterResponse {
  data: {
    user: User;
  };
}

export interface FetchUserResponse {
  data: {
    user: User;
  };
}

export interface ProfileResponse {
  data: {
    user: User & {
      accounts: { provider: string }[];
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const Judge0LanguageMap = {
  javascript: { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  python: { id: 71, name: "Python (3.8.1)" },
  java: { id: 62, name: "Java (OpenJDK 13.0.1)" },
  typescript: { id: 74, name: "TypeScript (3.7.4)" },
} as const;
