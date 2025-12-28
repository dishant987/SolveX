import { type ReactNode } from 'react';
import { Label } from './ui/label';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
    required?: boolean;
}

export function FormField({ label, htmlFor, error, children, required }: FormFieldProps) {
    return (
        <div className="space-y-2">
            <Label
                htmlFor={htmlFor}
                className="text-sm font-medium text-foreground "
            >
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {children}
            {error && (
                <div className="flex items-center gap-1.5 text-sm text-destructive animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
