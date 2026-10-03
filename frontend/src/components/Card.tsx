import type { ReactNode } from 'react';

export type CardTone = 'paper' | 'sage' | 'lavender' | 'forest';

const tones: Record<CardTone, string> = {
  paper: 'bg-paper border-line',
  sage: 'bg-[var(--card-sage-bg)] border-[var(--card-sage-border)]',
  lavender: 'bg-[var(--card-lav-bg)] border-[var(--card-lav-border)]',
  forest: 'bg-forest border-transparent text-onforest',
};

interface CardProps {
  tone?: CardTone;
  className?: string;
  children: ReactNode;
}

/** Rounded content card (Figma radius 20–22px, shadow on featured). */
export function Card({ tone = 'paper', className = '', children }: CardProps) {
  return (
    <section
      className={`rounded-[20px] border p-[22px] ${tones[tone]} ${tone === 'paper' || tone === 'sage' ? 'shadow-card' : ''} ${className}`.trim()}
    >
      {children}
    </section>
  );
}

interface HeroCardProps {
  eyebrow?: string;
  title: string;
  body?: string;
  duration?: string;
  action: ReactNode;
}

/** Forest hero card with petal art (Figma check-in card). */
export function ForestHeroCard({ eyebrow, title, body, duration, action }: HeroCardProps) {
  return (
    <section className="otula-hero relative flex min-h-[290px] items-center overflow-hidden rounded-[28px] bg-forest p-[clamp(32px,5vw,52px)] text-onforest shadow-card">
      <div className="otula-hero-art" aria-hidden="true">
        <div className="otula-petal otula-petal-one" />
        <div className="otula-petal otula-petal-two" />
        <div className="otula-petal otula-petal-three" />
        <div className="otula-center-dot" />
      </div>
      <div className="relative z-[2] max-w-[510px]">
        {duration ? (
          <p className="flex items-center text-[11px] font-bold uppercase tracking-[1.3px] opacity-80">
            <span className="mr-0.5 inline-block h-1 w-1 rounded-full bg-peach" />
            <span className="mr-0.5 inline-block h-1 w-1 rounded-full bg-peach" />
            &nbsp;{duration}
          </p>
        ) : null}
        {eyebrow ? (
          <p className="otula-hero-eyebrow text-[11px] font-bold uppercase tracking-[1.5px] text-peach-soft">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="-tracking-[0.4px] mt-[18px] font-serif text-[clamp(29px,3vw,40px)] font-semibold leading-[1.08]">
          {title}
        </h2>
        {body ? <p className="otula-hero-body mb-[26px] mt-3 max-w-[470px] text-sm leading-[1.65]">{body}</p> : null}
        <div className="mt-[26px]">{action}</div>
      </div>
    </section>
  );
}
