import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            {/* Header */}
            <Header />
            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t">
                <Footer />
            </footer>
        </div>
    );
}
