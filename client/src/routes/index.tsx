import { Button } from '@/components/ui/button'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Code2, Shield, Users, Zap } from 'lucide-react'

const Index = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Hero Section */}
            <main className="flex-1">
                <section className="container mx-auto px-6 py-16 md:py-24 text-center">
                    <div className="max-w-3xl mx-auto animate-fade-in">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                            Level Up Your{' '}
                            <span className="text-primary">Coding Skills</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Practice coding challenges, prepare for interviews, and join a community
                            of developers pushing their limits every day.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register">
                                <Button variant="auth" size="lg" className="min-w-45 text-black">
                                    Start Coding Free
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button variant="outline" size="lg" className="min-w-45">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="container mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: Code2,
                                title: 'Practice Problems',
                                description: 'Thousands of coding challenges across all difficulty levels.',
                            },
                            {
                                icon: Zap,
                                title: 'Real-time Feedback',
                                description: 'Instant code execution and detailed test case results.',
                            },
                            {
                                icon: Shield,
                                title: 'Interview Prep',
                                description: 'Curated problem sets from top tech companies.',
                            },
                            {
                                icon: Users,
                                title: 'Community',
                                description: 'Discuss solutions and learn from fellow developers.',
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-300 animate-fade-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Stats Section */}
                <section className="container mx-auto px-6 py-16 text-center">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '5M+', label: 'Developers' },
                            { value: '3000+', label: 'Problems' },
                            { value: '200+', label: 'Companies' },
                            { value: '50+', label: 'Languages' },
                        ].map((stat, index) => (
                            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}

export const Route = createFileRoute('/')({
    component: Index,
})

