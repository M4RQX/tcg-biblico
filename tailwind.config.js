/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"EB Garamond"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        apostolos: { 50: '#eef4fb', 500: '#2563a8', 900: '#0b2545' },
        reis:       { 50: '#f5efea', 500: '#7a3d2d', 900: '#3a1d12' },
        profetas:   { 50: '#f1eee8', 500: '#5b4a2a', 900: '#2c2412' },
        patriarcas: { 50: '#f0ecdc', 500: '#8a6a2a', 900: '#3d2f12' },
        juizes:     { 50: '#f7e9e4', 500: '#a83c2a', 900: '#4d1812' },
        filisteus:  { 50: '#efe6db', 500: '#7e5a2b', 900: '#3a2812' },
        egipto:     { 50: '#f3eedb', 500: '#c0922b', 900: '#5a4112' },
        babilonia:  { 50: '#e9e7ee', 500: '#4b3f7a', 900: '#1f1736' },
        canaa:      { 50: '#e9efe7', 500: '#3f6b4a', 900: '#17321f' },
        roma:       { 50: '#ece8e2', 500: '#6b6056', 900: '#2b251f' },
        biblia: {
          capa: '#1f2a3a',
          capaEscura: '#0d1420',
          dourado: '#caa14a',
          douradoBrilho: '#e8c66a',
        },
      },
    },
  },
  plugins: [],
};
