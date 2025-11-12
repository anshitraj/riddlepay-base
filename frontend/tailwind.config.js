/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'], // dark: classes apply when [data-theme="dark"] is present
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        baseBlue: '#0052FF',
        baseDark: '#0B0D17',
        baseLight: '#1C1F2E',
        base: {
          blue: '#0052FF',
          'blue-dark': '#0039B3',
          'blue-light': '#0066FF',
        },
      },
      backgroundImage: {
        'base-gradient': 'linear-gradient(135deg, #0052FF 0%, #7A5FFF 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

