import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export declare const Button: React.FC<ButtonProps>;
export declare const Card: React.FC<CardProps>;
export declare const CardHeader: React.FC<CardHeaderProps>;
export declare const CardTitle: React.FC<CardTitleProps>;
export declare const CardDescription: React.FC<CardDescriptionProps>;
export declare const CardContent: React.FC<CardContentProps>;
export declare const Badge: React.FC<BadgeProps>;
export declare const SomeUIComponent: () => string;