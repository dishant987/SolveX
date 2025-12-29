import type { FetchUserResponse, User } from "@/types/types";
import { useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { api } from "./api";
import { queryClient } from "./queryClient";
import { useNavigate } from "@tanstack/react-router";

type AuthProviderProps = {
    children: React.ReactNode;
    initialUser?: User | null;
};

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(initialUser);
    const navigate = useNavigate();
    const isFetching = useRef(false);
    const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    const fetchUser = async () => {
        if (isFetching.current) return;

        isFetching.current = true;

        try {
            const res = await api.get<FetchUserResponse>("/auth/me");
            setUser(res.data.data.user);
            setAuthStatus("authenticated");
        } catch (err) {
            setUser(null); // ❗ONLY place logout decision is made
            setAuthStatus("unauthenticated");
        } finally {
            isFetching.current = false;
        }
    };


    useEffect(() => {
        fetchUser();
    }, []);

    const logout = async () => {
        setUser(null);
        queryClient.clear();
        setAuthStatus("unauthenticated");
        navigate({ to: "/login" });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: authStatus === "authenticated",
                setAuthStatus,
                setUser,
                fetchUser,
                loading: authStatus === "loading",
                logout,
                hasRole: (role) => user?.role === role,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
