import { RouterProvider } from '@tanstack/react-router'
import { useRouterAuth } from '@/hooks/useAuth' // Import the helper
import { router } from '@/router'
import type { RouterContext } from '@/types/types'

export function AppRouter() {
    const auth = useRouterAuth() // Get router-specific auth

    return (
        <RouterProvider
            router={router}
            context={{
                auth, // Use directly
            } as RouterContext}
        />
    )
}