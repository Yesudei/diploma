import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50';

  const variants = {
    primary:
      'bg-[#C9A84C] text-[#0A0A0F] hover:bg-[#E8C96D] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(201,168,76,0.28)]',
    outline:
      'border border-[rgba(245,240,232,0.20)] text-[#F5F0E8] hover:bg-[rgba(245,240,232,0.05)] hover:border-[rgba(245,240,232,0.40)]',
    ghost: 'text-[#7A7570] hover:text-[#F5F0E8] bg-transparent border-none',
  };

  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-[15px] px-8 py-4',
    lg: 'text-base px-10 py-[17px]',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
