/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        forest: {
          DEFAULT: 'var(--forest)',
          deep: 'var(--forest-deep)',
        },
        sage: {
          DEFAULT: 'var(--sage)',
          light: 'var(--sage-light)',
        },
        cream: 'var(--cream)',
        paper: 'var(--paper)',
        line: 'var(--line)',
        peach: {
          DEFAULT: 'var(--peach)',
          soft: 'var(--peach-soft)',
        },
        lavender: 'var(--lavender)',
        clay: {
          DEFAULT: 'var(--clay)',
          deep: 'var(--clay-deep)',
        },
        onforest: 'var(--on-forest)',
        peachink: 'var(--peach-ink)',
        danger: 'var(--danger)',
        warm: 'var(--warm)',
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
        card: 'var(--shadow)',
        modal: 'var(--modal-shadow)',
      },
    },
  },
  plugins: [],
};
