import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
};

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
    return (
        <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
    );
}
