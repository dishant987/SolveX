import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProtectedRouteProps {
    children: React.ReactNode;

    /** Where to redirect if unauthenticated (default: /login) */
    redirectTo?: string;

    /** Custom loader while auth is being resolved */
    fallback?: React.ReactNode;
}

export function ProtectedRoute({
    children,
    redirectTo = "/login",
    fallback,
}: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate({ to: redirectTo });
        }
    }, [loading, isAuthenticated, redirectTo, navigate]);

    if (loading) {
        return (
            fallback ?? (
                <div className="min-h-screen flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            )
        );
    }

    if (!isAuthenticated) return null;

    return <>{children}</>;
}
