import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { Menu, LogOut, User, Plus, X } from "lucide-react"

import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { LogoutDialog } from "./LogoutDialog"
import { publicApi } from "@/lib/public-api"
import { useToast } from "@/hooks/use-toast"
import { NavLink } from "./NavLink"

export const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, loading, logout } = useAuth()
  const { toast } = useToast();
  const fullName = user ? `${user.firstName} ${user.lastName}` : ""
  const isAdmin = user?.role === "ADMIN"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return

    try {
      setIsLoggingOut(true)

      // server-side logout (cookie / session cleanup)
      await publicApi.post("/auth/logout")

      logout()

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        duration: 4000,
        variant: "success",
      })

      setLogoutOpen(false)
      setMobileMenuOpen(false)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <header className="h-14 sm:h-16 border-b bg-background" />
    )
  }




  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? "lg:mx-6 lg:mt-3 border-t lg:top-4 rounded-xl border bg-background/95 backdrop-blur-md shadow-lg"
        : "border-b bg-background"
        }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo className="h-8 w-auto sm:h-9" />
          </div>

          {/* Center Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink
              to="/about"
              exact
              activeClassName="text-primary"
              className="px-3 py-2 text-sm font-medium"
            >
              About
            </NavLink>
            <NavLink
              to="/problems"
              exact
              activeClassName="text-primary"
              className="px-3 py-2 text-sm font-medium"
            >
              Problems
            </NavLink>

            {isAdmin && (
              <Link to="/problems/create" className="cursor-pointer">
                <Button
                  size="sm"
                  className="ml-2 gap-1.5 px-4 py-2 h-9 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <Plus className="h-4 w-4" />
                  Create Problem
                </Button>
              </Link>
            )}
          </nav>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />

            {!isAuthenticated ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="px-4">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="auth" size="sm" className="text-black px-4">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <>


                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer h-8 w-8 sm:h-9 sm:w-9">
                      <AvatarImage src={user?.imageUrl} alt={fullName} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {fullName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    {/* Full name display */}
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setLogoutOpen(true)}
                      className="text-destructive flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Tablet Navigation (768px - 1023px) */}
          <nav className="hidden md:flex lg:hidden items-center space-x-2 mx-4">
            <NavLink
              to="/about"
              exact
              activeClassName="text-primary"
              className="px-3 py-2 text-sm font-medium"
            >
              About
            </NavLink>
            <NavLink
              to="/problems"
              exact
              activeClassName="text-primary"
              className="px-3 py-2 text-sm font-medium"
            >
              Problems
            </NavLink>
          </nav>

          {/* Tablet Right Section */}
          <div className="hidden md:flex lg:hidden items-center gap-3">
            {isAdmin && (
              <Link to="/problems/create">
                <Button
                  size="sm"
                  className="gap-1 px-3 py-1.5 h-8 text-xs rounded-lg"
                  variant="outline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create
                </Button>
              </Link>
            )}
            <ThemeToggle />

            {isAuthenticated ? (
              <Avatar className="cursor-pointer h-8 w-8">
                <AvatarImage src={user?.imageUrl} alt={fullName} />
                <AvatarFallback className="text-xs">
                  {fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="px-3 text-xs">
                  Sign in
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle className="md:hidden" />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between py-4 border-b">
                    <Logo className="h-7" />

                  </div>

                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col space-y-1 py-6">
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-base py-3">
                        About
                      </Button>
                    </Link>
                    <Link to="/problems" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-base py-3">
                        Problems
                      </Button>
                    </Link>

                    {isAdmin && (
                      <Link to="/problems/create" onClick={() => setMobileMenuOpen(false)} className="cursor-pointer">
                        <Button className="w-full justify-start text-base py-3 mt-4 bg-gradient-to-r from-primary to-primary/90 text-white">
                          <Plus className="mr-2 h-5 w-5" />
                          Create Problem
                        </Button>
                      </Link>
                    )}
                  </nav>

                  {/* User Section */}
                  <div className="mt-auto pt-6 border-t">
                    {isAuthenticated ? (
                      <>
                        {/* User Info */}
                        <div className="px-4 py-3 bg-accent/50 rounded-lg mb-4">
                          <p className="text-sm font-medium">{fullName}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>

                        <div className="space-y-2">
                          <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start">
                              <User className="mr-2 h-4 w-4" />
                              Profile
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            className="w-full justify-start mt-2"
                            onClick={() => setLogoutOpen(true)}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full">
                            Sign in
                          </Button>
                        </Link>
                        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="auth" className="w-full text-black">
                            Get Started
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Tablet Menu Button */}
            <Sheet>
              <SheetTrigger asChild className="hidden md:flex lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-6">
                  {!isAuthenticated ? (
                    <>
                      <Link to="/login">
                        <Button variant="ghost" className="w-full">
                          Sign in
                        </Button>
                      </Link>
                      <Link to="/register">
                        <Button variant="auth" className="w-full text-black">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* User Info */}
                      <div className="px-3 py-2 bg-accent/30 rounded-lg">
                        <p className="text-sm font-medium">{fullName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>

                      <Link to="/profile">
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={() => setLogoutOpen(true)}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <LogoutDialog
        open={logoutOpen}
        onOpenChange={!isLoggingOut ? setLogoutOpen : () => { }}
        onConfirm={handleLogout}
        loading={isLoggingOut}
      />
    </header>
  )
}