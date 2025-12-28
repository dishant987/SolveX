import { forwardRef, useState } from 'react';
import { Input, type InputProps } from './ui/input';
import { Button } from './ui/button';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    type={showPassword ? 'text' : 'password'}
                    className={className}
                    {...props}
                />
                <Button
                    type="button"
                   
                    size="icon"
                    className=" cursor-pointer
                        absolute right-0 top-0 h-11 w-11
                        bg-transparent
                        hover:bg-transparent
                        active:bg-transparent
                        focus-visible:bg-transparent
                        text-muted-foreground
                        hover:text-foreground
                    "
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </Button>

            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';
