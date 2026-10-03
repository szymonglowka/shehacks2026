import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}

/**
 * Centered modal (rise/fade); becomes a full-screen sheet ≤620px.
 * Closes on backdrop click and Escape; focus moves into the dialog.
 */
export function Modal({ title, eyebrow, onClose, children, labelledBy = 'modal-title' }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="otula-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="otula-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute right-[18px] top-[18px] grid h-10 w-10 place-items-center rounded-full hover:bg-sage-light"
        >
          <X size={20} strokeWidth={1.8} />
        </button>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{eyebrow}</p>
        ) : null}
        <h2 id={labelledBy} className="mb-[10px] mt-3 font-serif text-[34px] font-semibold leading-[1.1]">
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}
