import { AuthContext } from "@/lib/AuthContext"
import type { RouterContext } from "@/types/types"
import { useContext } from "react"

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return ctx
}

export function useRouterAuth(): RouterContext['auth'] {
    const auth = useAuth()
    return {
        user: auth.user,
        hasRole: auth.hasRole,
    }
}
