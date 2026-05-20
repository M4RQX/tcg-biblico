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
        // ---- Faccoes (frente das cartas) ----
        apostolos:  { 50: '#eef4fb', 500: '#2563a8', 900: '#0b2545' },
        reis:       { 50: '#f5efea', 500: '#7a3d2d', 900: '#3a1d12' },
        profetas:   { 50: '#f1eee8', 500: '#5b4a2a', 900: '#2c2412' },
        patriarcas: { 50: '#f0ecdc', 500: '#8a6a2a', 900: '#3d2f12' },
        juizes:     { 50: '#f7e9e4', 500: '#a83c2a', 900: '#4d1812' },
        filisteus:  { 50: '#efe6db', 500: '#7e5a2b', 900: '#3a2812' },
        egipto:     { 50: '#f3eedb', 500: '#c0922b', 900: '#5a4112' },
        babilonia:  { 50: '#e9e7ee', 500: '#4b3f7a', 900: '#1f1736' },
        canaa:      { 50: '#e9efe7', 500: '#3f6b4a', 900: '#17321f' },
        roma:       { 50: '#ece8e2', 500: '#6b6056', 900: '#2b251f' },
        // ---- Costas das cartas (Biblia cinzenta) ----
        biblia: {
          capa: '#8a8a8a',
          capaEscura: '#6e6e6e',
          capaClara: '#a3a3a3',
          tetragrama: '#2a2a2a',
          tetragramaSombra: '#1a1a1a',
          texto: '#3d3d3d',
          borda: '#5a5a5a',
        },
        // ---- Tema pergaminho (mesa de jogo clara) ----
        pergaminho: {
          DEFAULT: '#f1e7cf',
          claro: '#faf4e3',
          medio: '#e8dabb',
          escuro: '#dac9a1',
          borda: '#c8b285',
        },
        tinta: {
          DEFAULT: '#3a2f20',
          suave: '#6a5b43',
          fraca: '#9b8a6c',
        },
        ouro: {
          DEFAULT: '#b07d22',
          claro: '#d6a93f',
          escuro: '#866018',
        },
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-14px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'coach-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(176,125,34,0.0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(176,125,34,0.16)' },
        },
        'rise': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.28s cubic-bezier(0.2,0.8,0.2,1)',
        'coach-glow': 'coach-glow 2.2s ease-in-out infinite',
        'rise': 'rise 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
