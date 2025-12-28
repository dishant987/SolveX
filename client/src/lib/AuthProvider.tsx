import type { AuthContextValue, FetchUserResponse, User } from "@/types/types";
import { useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { api } from "./api";
import type { AxiosError } from "axios";
import { queryClient } from "./queryClient";

type AuthProviderProps = {
    children: React.ReactNode;
    initialUser?: User | null;
};

export function AuthProvider({
    children,
    initialUser = null,
}: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [loading, setLoading] = useState<boolean>(true);
    const hasFetched = useRef(false); // 🔒 prevents double calls

    const fetchUser = async () => {
       if (hasFetched.current) return;

        try {
            const response = await api.get<FetchUserResponse>("/auth/me");
            setUser(response.data.data.user);
             hasFetched.current = true; 
        } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 401) {
                setUser(null);
            } else {
                console.error("Auth fetch failed:", error);
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        queryClient.clear();
        hasFetched.current = false;
        window.location.replace("/login");
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const value: AuthContextValue = {
        user,
        isAuthenticated: !!user,
        setUser,
        fetchUser,
        loading,
        logout,
        hasRole: (role) => user?.role === role,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
