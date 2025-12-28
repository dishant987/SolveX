import { ThemeContext } from "@/lib/theme";
import { useContext } from "react";

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}