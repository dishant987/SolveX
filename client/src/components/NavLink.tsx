import { forwardRef } from "react";
import { 
  Link, 
  type LinkProps,
  useRouterState 
} from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps
    extends Omit<LinkProps, "className"> {
    className?: string;
    activeClassName?: string;
    pendingClassName?: string;
    exact?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
    (
        {
            className,
            activeClassName,
            pendingClassName,
            to,
            exact = false,
            ...props
        },
        ref
    ) => {
      
        const { pendingMatches } = useRouterState();

        // Get the current location pathname
        const currentPath = window.location.pathname;
        
        // Determine if active based on exact or partial match
        let isActive = false;
        
        if (exact) {
            // Exact match
            isActive = currentPath === to;
        } else {
            // Check if current path starts with the link's path
            // but also ensure we don't match parent routes too broadly
            if (to === "/") {
                // For home, only match exactly or with query params
                isActive = currentPath === "/";
            } else {
                // For other routes, check if path starts with the route
                // And the next character is either end of string, /, or ?
                const escapedTo = to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`^${escapedTo}(?:/|\\?|$)`);
                isActive = regex.test(currentPath);
            }
        }

        return (
            <Link
                ref={ref}
                to={to}
                activeOptions={{ exact }}
                className={cn(
                    // Base styles
                    "relative px-4 py-3 text-sm font-medium transition-all duration-300",
                    "group",
                    
                    // Default state
                    "text-muted-foreground hover:text-foreground",
                    
                    // Hover effects
                    "after:absolute after:inset-x-4 after:-bottom-1 after:h-0.5",
                    "after:bg-primary/30 after:rounded-full after:opacity-0",
                    "after:transition-all after:duration-300",
                    "hover:after:opacity-100 hover:after:-bottom-1.5",
                    
                    // Focus states
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "focus-visible:rounded-md",
                    
                    // Active state
                    isActive && [
                        "text-primary font-semibold",
                        "after:opacity-100 after:-bottom-1.5 after:bg-primary",
                        "after:shadow-[0_0_8px_rgba(var(--primary),0.3)]",
                        "before:absolute before:inset-0 before:rounded-lg",
                        "before:bg-gradient-to-b before:from-primary/5 before:to-transparent",
                        "before:-z-10 before:transition-all before:duration-300"
                    ],
                    
                    // Animation on hover for non-active items
                    !isActive && [
                        "hover:before:absolute hover:before:inset-0 hover:before:rounded-lg",
                        "hover:before:bg-accent/30 hover:before:-z-10",
                        "hover:before:transition-all hover:before:duration-300"
                    ],
                    
                    className,
                    isActive && activeClassName,
                    pendingMatches && pendingClassName
                )}
                {...props}
            />
        );
    }
);

NavLink.displayName = "NavLink";

export { NavLink };