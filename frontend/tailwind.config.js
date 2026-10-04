// Theme colours are CSS variables (day/night). Wrapping them in color-mix with <alpha-value>
// makes Tailwind opacity modifiers (bg-forest/10, border-ink/15) work; without a modifier
// alpha is 1 → 100% → the plain variable.
const c = (v) => `color-mix(in srgb, var(${v}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: c('--ink'),
        muted: c('--muted'),
        forest: {
          DEFAULT: c('--forest'),
          deep: c('--forest-deep'),
        },
        sage: {
          DEFAULT: c('--sage'),
          light: c('--sage-light'),
        },
        cream: c('--cream'),
        paper: c('--paper'),
        line: c('--line'),
        peach: {
          DEFAULT: c('--peach'),
          soft: c('--peach-soft'),
        },
        lavender: c('--lavender'),
        clay: {
          DEFAULT: c('--clay'),
          deep: c('--clay-deep'),
        },
        onforest: c('--on-forest'),
        peachink: c('--peach-ink'),
        danger: c('--danger'),
        warm: c('--warm'),
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        hero: '28px',
      },
      boxShadow: {
        card: c('--shadow'),
        modal: c('--modal-shadow'),
      },
    },
  },
  plugins: [],
};
