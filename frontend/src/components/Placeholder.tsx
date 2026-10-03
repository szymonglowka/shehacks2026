interface PlaceholderProps {
  title: string;
  eyebrow?: string;
  description?: string;
}

/**
 * Shared Placeholder pattern (from Figma): 70px icon tile, eyebrow,
 * serif H1, description. Feature owners replace pages, not the pattern.
 */
export function Placeholder({ title, eyebrow, description }: PlaceholderProps) {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-6 py-16 text-center">
      <div>
        <div
          aria-hidden="true"
          className="mx-auto mb-6 grid h-[70px] w-[70px] place-items-center rounded-2xl bg-sage text-forest"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 36 36"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18 17.8C6 15.2 7 4.9 11.3 4.1c4.5-.9 6.4 5.7 6.7 13.7Z" />
            <path d="M18 17.8C30 15.2 29 4.9 24.7 4.1c-4.5-.9-6.4 5.7-6.7 13.7Z" />
            <path d="M18 18.2C6 20.8 7 31.1 11.3 31.9c4.5.9 6.4-5.7 6.7-13.7Z" />
            <path d="M18 18.2c12 2.6 11 12.9 6.7 13.7-4.5.9-6.4-5.7-6.7-13.7Z" />
          </svg>
        </div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-serif text-4xl font-semibold">{title}</h1>
        {description ? <p className="mt-3 text-sm text-muted">{description}</p> : null}
      </div>
    </main>
  );
}
