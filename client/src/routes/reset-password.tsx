import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useResetPassword } from '@/lib/api/problems';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

export const Route = createFileRoute('/reset-password')({
  component: ResetPassword,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string,
    };
  },
});

function ResetPassword() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid reset link",
        description: "The reset link is invalid or has expired.",
        variant: "destructive",
      });
      navigate({ to: '/forgot-password', replace: true });
    }
  }, [token, navigate, toast]);

  const {
    register,
    handleSubmit,

    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });



  const resetPasswordMutation = useResetPassword({
    onSuccess: (data) => {
      toast({
        title: "Password reset successful",
        description: "Your password has been updated successfully. You can now sign in with your new password.",
        variant: "success",
      });
      setPasswordChanged(true);

      // Navigate to login after 3 seconds
      setTimeout(() => {
        navigate({ to: '/login', replace: true });
      }, 3000);
    },
    onError: (error: any) => {
      if (error?.response?.status === 400) {
        const errorMessage = error.response?.data?.message || error.message;

        if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
          toast({
            title: "Invalid or expired token",
            description: "This reset link is invalid or has expired. Please request a new password reset link.",
            variant: "destructive",
          });

          // Redirect to forgot password page
          setTimeout(() => {
            navigate({ to: '/forgot-password', replace: true });
          }, 2000);
        } else {
          toast({
            title: "Error",
            description: errorMessage || "Failed to reset password. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    // Convert from form fields (password) to API fields (newPassword)
    resetPasswordMutation.mutate({
      token,
      newPassword: data.password, // Map 'password' from form to 'newPassword' for API
    });
  };

  // If no token, show loading state while redirecting
  if (!token) {
    return (
      <AuthLayout title="Loading..." subtitle="Validating reset link...">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </AuthLayout>
    );
  }

  // Success state after password reset
  if (passwordChanged) {
    return (
      <AuthLayout
        title="Password Reset Successful!"
        subtitle="Your password has been updated successfully."
      >
        <div className="space-y-6">
          <div className="rounded-lg bg-success/10 border border-success/20 p-6 text-center">
            <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-success mb-2">
              Password Updated
            </h3>
            <p className="text-sm text-muted-foreground">
              You will be redirected to the login page in a few seconds.
            </p>
          </div>

          <Button
            type="button"
            variant="auth"
            size="lg"
            className="w-full"
            onClick={() => navigate({ to: '/login' })}
          >
            Go to Login
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Didn't mean to reset your password?{' '}
            <Link
              to="/"
              className="font-medium text-primary hover:underline"
            >
              Return home
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Create a new password for your account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          label="New Password"
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <PasswordInput
            id="password"
            className='mt-2'
            placeholder="Enter new password"
            autoComplete="new-password"
            error={!!errors.password}
            {...register('password')}
          />

        </FormField>

        <FormField
          label="Confirm New Password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <PasswordInput
            id="confirmPassword"
            className='mt-2'
            placeholder="Confirm new password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>

        <Button
          type="submit"
          variant="auth"
          size="lg"
          className="w-full"
          disabled={resetPasswordMutation.isPending || !isValid}
        >
          {resetPasswordMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" />
              Resetting password...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>

        <div className="pt-4 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <p className="font-medium mb-1">Password Requirements:</p>
          <ul className="space-y-1">
            <li>• Must be at least 8 characters long</li>
            <li>• Must contain at least one uppercase letter</li>
            <li>• Must contain at least one lowercase letter</li>
            <li>• Must contain at least one number</li>
          </ul>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Need a new reset link?{' '}
          <Link
            to="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            Request new link
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}