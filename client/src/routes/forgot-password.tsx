import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { resetPasswordRequestSchema, type ResetPasswordRequestData } from '@/lib/validations';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useForgotPassword } from '@/lib/api/problems';
import type { AxiosError } from 'axios';

export const Route = createFileRoute('/forgot-password')({
    component: ForgotPassword,
});

function ForgotPassword() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<ResetPasswordRequestData>({
        resolver: zodResolver(resetPasswordRequestSchema),
        mode: 'onChange',
    });

    const forgotMutation = useForgotPassword();

    const onSubmit = async (data: ResetPasswordRequestData) => {
        try {
            await forgotMutation.mutateAsync(data);

            toast({
                title: "Reset link sent",
                description: "If an account exists with this email, you will receive a password reset link shortly.",
                variant: "success",
            });

        } catch (error: AxiosError) {
            if (error?.response?.status === 400) {
                toast({
                    title: "Cannot reset password",
                    description: error.response?.data?.message || "This account uses social login. Please sign in with your social provider.",
                    variant: "destructive",
                });
            } else if (error?.response?.status === 404) {

                toast({
                    title: "Reset link sent",
                    description: "If an account exists with this email, you will receive a password reset link shortly.",
                    variant: "success",
                });
            } else {

                toast({
                    title: "Error",
                    description: error.message || "Failed to send reset link. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };

    const handleBack = () => {
        navigate({ to: '/login' });
    };

    const isDisabled = forgotMutation.isPending || !isValid;

    return (
        <AuthLayout
            title="Forgot your password?"
            subtitle="Enter your email address and we'll send you a link to reset your password."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                    label="Email"
                    htmlFor="email"
                    error={errors.email?.message}
                    required
                >
                    <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className='mt-2'
                        autoComplete="email"
                        error={!!errors.email}
                        {...register('email')}
                    />
                </FormField>

                <Button
                    type="submit"
                    variant="auth"
                    size="lg"
                    className="w-full"
                    disabled={isDisabled}
                >
                    {forgotMutation.isPending ? (
                        <>
                            <LoadingSpinner size="sm" />
                            Sending reset link...
                        </>
                    ) : (
                        'Send Reset Link'
                    )}
                </Button>

                <div className="flex flex-col space-y-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={handleBack}
                        disabled={forgotMutation.isPending}
                    >
                        ← Back to Login
                    </Button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                    to="/register"
                    className="font-medium text-primary hover:underline focus:outline-none focus:underline"
                >
                    Sign up
                </Link>
            </p>
        </AuthLayout>
    );
}