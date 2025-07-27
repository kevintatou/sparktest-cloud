// Modern UI components for Tatou SaaS platform
import React from 'react';

// Utility function for className merging
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Button Component with multiple variants
export const Button = ({ children, variant = 'default', size = 'default', className = '', disabled = false, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
    outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  };
  
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8',
    icon: 'h-9 w-9'
  };
  
  return (
    <button 
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input = ({ className = '', type = 'text', ...props }) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
};

// Label Component
export const Label = ({ className = '', ...props }) => (
  <label
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
);

// Card Components
export const Card = ({ children, className = '', ...props }) => (
  <div 
    className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <div className={cn('font-semibold leading-none tracking-tight', className)} {...props}>
    {children}
  </div>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <div className={cn('text-sm text-muted-foreground', className)} {...props}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
    {children}
  </div>
);

// Badge Component
export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
    outline: 'text-foreground'
  };
  
  return (
    <div className={cn(baseClasses, variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

// Alert Component
export const Alert = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: 'border-border bg-background text-foreground',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertDescription = ({ className = '', ...props }) => (
  <div
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
);

// Table Components
export const Table = ({ className = '', ...props }) => (
  <div className="relative w-full overflow-auto">
    <table
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
);

export const TableHeader = ({ className = '', ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
);

export const TableBody = ({ className = '', ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableFooter = ({ className = '', ...props }) => (
  <tfoot
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
);

export const TableRow = ({ className = '', ...props }) => (
  <tr
    className={cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
);

export const TableHead = ({ className = '', ...props }) => (
  <th
    className={cn(
      'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
);

export const TableCell = ({ className = '', ...props }) => (
  <td
    className={cn(
      'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
);

// Form Components
export const Form = ({ children, className = '', onSubmit, ...props }) => (
  <form
    className={cn('space-y-6', className)}
    onSubmit={onSubmit}
    {...props}
  >
    {children}
  </form>
);

export const FormField = ({ children, className = '', ...props }) => (
  <div className={cn('space-y-2', className)} {...props}>
    {children}
  </div>
);

export const FormMessage = ({ children, className = '', type = 'error', ...props }) => {
  const types = {
    error: 'text-destructive text-sm',
    success: 'text-green-600 text-sm',
    info: 'text-blue-600 text-sm'
  };

  return (
    <p className={cn(types[type], className)} {...props}>
      {children}
    </p>
  );
};

// Avatar Component
export const Avatar = ({ children, className = '', ...props }) => (
  <span
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  >
    {children}
  </span>
);

export const AvatarImage = ({ className = '', ...props }) => (
  <img
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
);

export const AvatarFallback = ({ className = '', ...props }) => (
  <div
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
);

// Progress Component
export const Progress = ({ value = 0, className = '', ...props }) => (
  <div
    className={cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

// Skeleton Component for loading states
export const Skeleton = ({ className = '', ...props }) => (
  <div
    className={cn('animate-pulse rounded-md bg-primary/10', className)}
    {...props}
  />
);

// Separator Component
export const Separator = ({ orientation = 'horizontal', className = '', ...props }) => (
  <div
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )}
    {...props}
  />
);

// Navigation Components
export const NavigationMenu = ({ children, className = '', ...props }) => (
  <nav className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)} {...props}>
    {children}
  </nav>
);

export const NavigationMenuList = ({ children, className = '', ...props }) => (
  <div className={cn('group flex flex-1 list-none items-center justify-center space-x-1', className)} {...props}>
    {children}
  </div>
);

export const NavigationMenuItem = ({ children, className = '', ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

export const NavigationMenuLink = ({ children, className = '', ...props }) => (
  <a
    className={cn(
      'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </a>
);

// Tooltip Components
export const TooltipProvider = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const Tooltip = ({ children, ...props }) => (
  <div className="relative inline-block" {...props}>
    {children}
  </div>
);

export const TooltipTrigger = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const TooltipContent = ({ children, className = '', ...props }) => (
  <div
    className={cn(
      'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Switch Component
export const Switch = ({ checked = false, onCheckedChange, className = '', ...props }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
      checked ? 'bg-primary' : 'bg-input',
      className
    )}
    {...props}
  >
    <span
      className={cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
        checked ? 'translate-x-4' : 'translate-x-0'
      )}
    />
  </button>
);

// Loading Spinner
export const Spinner = ({ className = '', size = 'default' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <svg
      className={cn('animate-spin', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Command Palette Components
export const Command = ({ children, className = '', ...props }) => (
  <div
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CommandInput = ({ className = '', ...props }) => (
  <div className="flex items-center border-b px-3">
    <Input
      className={cn(
        'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
);

export const CommandList = ({ children, className = '', ...props }) => (
  <div
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
    {...props}
  >
    {children}
  </div>
);

export const CommandEmpty = ({ children, className = '', ...props }) => (
  <div
    className={cn('py-6 text-center text-sm', className)}
    {...props}
  >
    {children}
  </div>
);

export const CommandGroup = ({ children, className = '', ...props }) => (
  <div
    className={cn(
      'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CommandItem = ({ children, className = '', ...props }) => (
  <div
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Legacy component for backward compatibility
export const SomeUIComponent = () => {
  return "Tatou UI Component";
};