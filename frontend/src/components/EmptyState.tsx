import type { ReactNode } from 'react';
import { Eyebrow } from './Eyebrow';

interface EmptyStateProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body?: string;
  action?: ReactNode;
}

/** Empty-section pattern (70px tile, eyebrow, serif H1, action). */
export function EmptyState({ icon, eyebrow, title, body, action }: EmptyStateProps) {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <div className="mx-auto mb-5 grid h-[70px] w-[70px] place-items-center rounded-2xl bg-sage text-forest">
        {icon}
      </div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-2 font-serif text-[27px] font-semibold">{title}</h2>
      {body ? <p className="mx-auto mt-2 max-w-[380px] text-sm leading-relaxed text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`otula-skeleton rounded-[14px] bg-sage-light ${className}`.trim()} />
  );
}
