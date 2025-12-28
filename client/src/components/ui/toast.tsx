import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-100 flex max-h-screen w-full flex-col p-4",
      "md:max-w-105",
      className
    )}
    {...props}
  />

));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  cn(
    "group pointer-events-auto relative flex w-full items-start space-x-3",
    "overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
    "backdrop-blur-sm bg-background/95",
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in",
    "data-[state=closed]:animate-out",
    "data-[swipe=end]:animate-out",
    "data-[state=closed]:fade-out-80",
    "data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
    // Smooth animations
    "duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
  ),
  {
    variants: {
      variant: {
        default: "border-border bg-background/95",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-50",
        destructive: "border-red-500/20 bg-red-500/10 text-red-900 dark:text-red-50",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-50",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-900 dark:text-blue-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const ToastIcon = ({ variant }: { variant?: string }) => {
  const iconProps = { className: "h-5 w-5 shrink-0" };

  switch (variant) {
    case "success":
      return <CheckCircle {...iconProps} />;
    case "destructive":
      return <AlertCircle {...iconProps} />;
    case "warning":
      return <AlertTriangle {...iconProps} />;
    case "info":
      return <Info {...iconProps} />;
    default:
      return null;
  }
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants> & {
    icon?: React.ReactNode;
  }
>(({ className, variant, icon, children, ...props }, ref) => {
  const showIcon = icon !== undefined ? icon : <ToastIcon variant={variant} />;

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {showIcon && (
        <div className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          variant === "success" && "bg-emerald-500/20",
          variant === "destructive" && "bg-red-500/20",
          variant === "warning" && "bg-amber-500/20",
          variant === "info" && "bg-blue-500/20",
          variant === "default" && "bg-primary/10"
        )}>
          {showIcon}
        </div>
      )}
      <div className="flex-1 space-y-1">
        {children}
      </div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium",
      "bg-transparent border transition-colors",
      "hover:bg-secondary/80 active:scale-95",
      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Variant specific styles
      "group-[.destructive]:border-red-300/30 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:hover:text-red-700",
      "group-[.success]:border-emerald-300/30 group-[.success]:hover:bg-emerald-500/20 group-[.success]:hover:text-emerald-700",
      "group-[.warning]:border-amber-300/30 group-[.warning]:hover:bg-amber-500/20 group-[.warning]:hover:text-amber-700",
      "group-[.info]:border-blue-300/30 group-[.info]:hover:bg-blue-500/20 group-[.info]:hover:text-blue-700",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-1 top-1 rounded-md p-1 opacity-70",
      "transition-all duration-200 ease-in-out",
      "hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10",
      "active:scale-95",
      "focus:outline-none focus:ring-1 focus:ring-ring",
      // Variant specific close button
      "group-[.destructive]:text-red-500 group-[.destructive]:hover:text-red-700 group-[.destructive]:hover:bg-red-500/10",
      "group-[.success]:text-emerald-500 group-[.success]:hover:text-emerald-700 group-[.success]:hover:bg-emerald-500/10",
      "group-[.warning]:text-amber-500 group-[.warning]:hover:text-amber-700 group-[.warning]:hover:bg-amber-500/10",
      "group-[.info]:text-blue-500 group-[.info]:hover:text-blue-700 group-[.info]:hover:bg-blue-500/10",
      "group-[.default]:text-muted-foreground",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 leading-relaxed", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// Custom hook for toast positioning
type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";

interface ToastOptions extends VariantProps<typeof toastVariants> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement<typeof ToastAction>;
  icon?: React.ReactNode;
  duration?: number;
  position?: ToastPosition;
}

// Export types
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  type ToastOptions,
  type ToastPosition,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
};