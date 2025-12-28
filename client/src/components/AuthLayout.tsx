import { type ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (


        < main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12" >
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-muted-foreground">{subtitle}</p>
                    )}
                </div>

                <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
                    {children}
                </div>
            </div>
        </main >

    );
}
