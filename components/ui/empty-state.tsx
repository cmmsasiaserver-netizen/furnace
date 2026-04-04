import React from 'react'
import { LucideIcon, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  className,
  children
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500",
      className
    )}>
      <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 shadow-inner">
        <Icon className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-2">{title}</h3>
      {description && <p className="text-xs text-slate-400 font-medium max-w-[240px] leading-relaxed">{description}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  )
}
