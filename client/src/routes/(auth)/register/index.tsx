import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { publicApi } from '@/lib/public-api';
import { useApiMutation } from '@/lib/typed-mutation';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import type { RegisterResponse } from '@/types/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link,  useNavigate } from '@tanstack/react-router'
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export const Route = createFileRoute('/(auth)/register/')({
  component: Register,
})

function Register() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { setUser, fetchUser ,isAuthenticated } = useAuth();
   const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => {
    console.log(isAuthenticated);
    if (isAuthenticated) {
      navigate({ to: '/', replace: true });
    }
  }, [isAuthenticated,navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const password = watch('password', '');

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ];

    const registerMutation = useApiMutation<RegisterResponse, RegisterFormData>({
      mutationFn: (data) =>
        publicApi.post('/auth/register', data).then((data) => data.data),
  
      onSuccess: (data) => {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        setUser(data.data.user);
        navigate({ to: '/', replace: true });
      },
  
      onError: (error) => {
        const apiError = error.response?.data;
        console.log(apiError);
        // Global error
        toast({
          variant: 'destructive',
          title: 'Registration failed',
          description:
            apiError?.message ?? 'Invalid email or password',
          duration: 5000,
        });
      },
    });

  const onSubmit = async (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join CodeHub and start your coding journey"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          label="First Name"
          htmlFor="firstName"
          error={errors.firstName?.message}
          required
        >
          <Input
            id="firstName"
            type="text"
            className='mt-2'
            placeholder="Choose a Firstname"
            autoComplete="firstname"
            error={!!errors.firstName}
            {...register('firstName')}
          />
        </FormField>
        <FormField
          label="Last Name"
          htmlFor="lastName"
          error={errors.lastName?.message}
          required
        >
          <Input
            id="lastName"
            type="text"
            className='mt-2'
            placeholder="Choose a Lastname"
            autoComplete="lastname"
            error={!!errors.lastName}
            {...register('lastName')}
          />
        </FormField>

        <FormField
          label="Email"
          htmlFor="email"
          error={errors.email?.message}
          required
        >
          <Input
            id="email"
            type="email"
            className='mt-2'
            placeholder="Enter your email"
            autoComplete="email"
            error={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <PasswordInput
            id="password"
            className='mt-2'
            placeholder="Create a password"
            autoComplete="new-password"
            error={!!errors.password}
            {...register('password')}
          />
          {password && (
            <div className="mt-3 space-y-1.5 animate-fade-in">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-sm ${req.met ? 'text-success' : 'text-muted-foreground'
                    }`}
                >
                  {req.met ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          )}
        </FormField>

        <FormField
          label="Confirm Password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <PasswordInput
            id="confirmPassword"
            className='mt-2'
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="terms"
            className="text-sm text-muted-foreground cursor-pointer leading-tight"
          >
            I agree to the{' '}
            <Link to="/" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          variant="auth"
          size="lg"
          className="w-full"
          disabled={registerMutation.isPending || !isValid || !agreedToTerms }
        >
          {registerMutation.isPending  ? (
            <>
              <LoadingSpinner size="sm" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>


      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary hover:underline focus:outline-none focus:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
