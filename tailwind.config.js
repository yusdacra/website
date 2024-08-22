const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts,md}'],
  theme: {
    extend: {
      typography: ({ theme }) => ({
        ralsei: {
          css: {
            '--tw-prose-body': theme('colors.ralsei.white'),
            '--tw-prose-headings': theme('colors.ralsei.pink.neon'),
            '--tw-prose-lead': theme('colors.ralsei.white'),
            '--tw-prose-links': theme('colors.ralsei.green.light'),
            '--tw-prose-bold': theme('colors.ralsei.white'),
            '--tw-prose-counters': theme('colors.ralsei.pink.regular'),
            '--tw-prose-bullets': theme('colors.ralsei.pink.regular'),
            '--tw-prose-hr': theme('colors.ralsei.white'),
            '--tw-prose-quotes': theme('colors.ralsei.white'),
            '--tw-prose-quote-borders': theme('colors.ralsei.white'),
            '--tw-prose-captions': theme('colors.ralsei.white'),
            '--tw-prose-code': theme('colors.ralsei.pink.regular'),
            '--tw-prose-pre-code': theme('colors.ralsei.white'),
            '--tw-prose-pre-bg': theme('colors.ralsei.green.dark'),
            '--tw-prose-th-borders': theme('colors.ralsei.white'),
            '--tw-prose-td-borders': theme('colors.ralsei.white'),
          },
        },
      }),
      animation: {
        'bounce-slow' : 'bounce 3s infinite',
        'pulse-fast' : 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        ralsei: {
          pink: {
            regular: '#fe96e0',
            neon: '#ff3eb7',
          },
          white: '#fff9fe',
          black: '#000801',
          green: {
            light: '#4dcc8e',
            dark: '#162d26',
          }
        }
      }
    },
    fontFamily: {
      'sans-serif': ['"Comic Sans", sans-serif'],
      monospace: ['"Comic Shanns", monospace'],
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

