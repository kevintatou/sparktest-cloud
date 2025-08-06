"use client"

import * as React from "react"
import { cn } from "../../utils"

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

interface SidebarContentProps {
  children: React.ReactNode
  className?: string
}

interface SidebarHeaderProps {
  children: React.ReactNode
  className?: string
}

interface SidebarNavProps {
  children: React.ReactNode
  className?: string
}

interface SidebarNavItemProps {
  children: React.ReactNode
  className?: string
  isActive?: boolean
  onClick?: () => void
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-screen w-64 flex-col border-r bg-background",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
)
SidebarContent.displayName = "SidebarContent"

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-16 items-center border-b px-6", className)}
      {...props}
    >
      {children}
    </div>
  )
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarNav = React.forwardRef<HTMLDivElement, SidebarNavProps>(
  ({ children, className, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn("space-y-2 p-4", className)}
      {...props}
    >
      {children}
    </nav>
  )
)
SidebarNav.displayName = "SidebarNav"

const SidebarNavItem = React.forwardRef<HTMLButtonElement, SidebarNavItemProps>(
  ({ children, className, isActive = false, onClick, ...props }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
SidebarNavItem.displayName = "SidebarNavItem"

export { Sidebar, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem }