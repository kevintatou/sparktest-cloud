// Type definitions for Tatou UI components
import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, TableHTMLAttributes, FormHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardTitleProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export interface AlertDescriptionProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  className?: string;
}

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  className?: string;
}

export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  className?: string;
}

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface FormMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  className?: string;
  type?: 'error' | 'success' | 'info';
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  className?: string;
}

export interface AvatarImageProps extends HTMLAttributes<HTMLImageElement> {
  className?: string;
}

export interface AvatarFallbackProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  className?: string;
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export interface SwitchProps extends HTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export interface NavigationMenuProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

export interface NavigationMenuListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface NavigationMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface NavigationMenuLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  className?: string;
}

export interface TooltipProviderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface TooltipTriggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CommandProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CommandInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export interface CommandListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CommandEmptyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CommandGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export interface CommandItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

// Component declarations
export declare const Button: React.FC<ButtonProps>;
export declare const Input: React.FC<InputProps>;
export declare const Label: React.FC<LabelProps>;
export declare const Card: React.FC<CardProps>;
export declare const CardHeader: React.FC<CardHeaderProps>;
export declare const CardTitle: React.FC<CardTitleProps>;
export declare const CardDescription: React.FC<CardDescriptionProps>;
export declare const CardContent: React.FC<CardContentProps>;
export declare const CardFooter: React.FC<CardFooterProps>;
export declare const Badge: React.FC<BadgeProps>;
export declare const Alert: React.FC<AlertProps>;
export declare const AlertDescription: React.FC<AlertDescriptionProps>;
export declare const Table: React.FC<TableProps>;
export declare const TableHeader: React.FC<TableHeaderProps>;
export declare const TableBody: React.FC<TableBodyProps>;
export declare const TableFooter: React.FC<TableFooterProps>;
export declare const TableRow: React.FC<TableRowProps>;
export declare const TableHead: React.FC<TableHeadProps>;
export declare const TableCell: React.FC<TableCellProps>;
export declare const Form: React.FC<FormProps>;
export declare const FormField: React.FC<FormFieldProps>;
export declare const FormMessage: React.FC<FormMessageProps>;
export declare const Avatar: React.FC<AvatarProps>;
export declare const AvatarImage: React.FC<AvatarImageProps>;
export declare const AvatarFallback: React.FC<AvatarFallbackProps>;
export declare const Progress: React.FC<ProgressProps>;
export declare const Skeleton: React.FC<SkeletonProps>;
export declare const Separator: React.FC<SeparatorProps>;
export declare const NavigationMenu: React.FC<NavigationMenuProps>;
export declare const NavigationMenuList: React.FC<NavigationMenuListProps>;
export declare const NavigationMenuItem: React.FC<NavigationMenuItemProps>;
export declare const NavigationMenuLink: React.FC<NavigationMenuLinkProps>;
export declare const TooltipProvider: React.FC<TooltipProviderProps>;
export declare const Tooltip: React.FC<TooltipProps>;
export declare const TooltipTrigger: React.FC<TooltipTriggerProps>;
export declare const TooltipContent: React.FC<TooltipContentProps>;
export declare const Switch: React.FC<SwitchProps>;
export declare const Spinner: React.FC<SpinnerProps>;
export declare const Command: React.FC<CommandProps>;
export declare const CommandInput: React.FC<CommandInputProps>;
export declare const CommandList: React.FC<CommandListProps>;
export declare const CommandEmpty: React.FC<CommandEmptyProps>;
export declare const CommandGroup: React.FC<CommandGroupProps>;
export declare const CommandItem: React.FC<CommandItemProps>;

// Legacy compatibility
export declare const SomeUIComponent: () => string;