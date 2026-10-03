import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'forest' | 'peach' | 'link' | 'text' | 'icon';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45';

const variants: Record<ButtonVariant, string> = {
  // Default CTA on light surfaces (Figma .primary-button.full)
  primary: 'bg-forest text-white hover:bg-forest-deep rounded-[14px] min-h-[46px] px-5 text-[13px]',
  // Alias kept for the forest-on-light CTA
  forest: 'bg-forest text-white hover:bg-forest-deep rounded-[14px] min-h-[46px] px-5 text-[13px]',
  // CTA on forest-green cards (Figma .primary-button)
  peach:
    'bg-peach-soft text-[#684b3d] hover:bg-[#f8e8df] rounded-[14px] min-h-[46px] px-5 text-[13px]',
  link: 'text-forest font-bold text-[12px] p-1 min-h-[44px] hover:underline underline-offset-4',
  text: 'text-muted font-medium text-[12px] min-h-[44px] px-2 hover:text-ink',
  icon: 'rounded-full w-10 h-10 grid place-items-center text-ink hover:bg-sage-light min-w-[44px] min-h-[44px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', full = false, className = '', type = 'button', ...rest },
  ref,
) {
  const sizeTweak = size === 'sm' ? 'min-h-[44px] px-4 text-[12px]' : '';
  const width = full ? 'w-full' : '';
  return (
    <button
      ref={ref}
      type={type}
      className={`${base} ${variants[variant]} ${sizeTweak} ${width} ${className}`.trim()}
      {...rest}
    />
  );
});
