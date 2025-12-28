import { useNavigate } from '@tanstack/react-router';
import { Code2 } from 'lucide-react';

export function Logo() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate({ to: "/" })}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <Code2 className="h-5 w-5 text-black" />
      </div>
      <span className="text-xl font-bold text-foreground">CodeHub</span>
    </div>
  );
}
