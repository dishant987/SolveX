import { createContext } from 'react'
import type { AuthContextValue } from '@/types/types'

export const AuthContext =
    createContext<AuthContextValue | undefined>(undefined)
