/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Gradients pré-definidos pra loja (bannerGradient vindo do DB)
    'from-rose-500', 'via-orange-500', 'to-amber-500',
    'from-cyan-500', 'via-blue-500', 'to-indigo-500',
    'from-emerald-500', 'via-teal-500', 'to-cyan-500',
    'from-indigo-600', 'via-purple-600', 'to-pink-600',
    'from-pink-500', 'via-red-500', 'to-orange-500',
    'from-slate-700', 'via-slate-900', 'to-black',
    'from-lime-500', 'via-green-500', 'to-emerald-500',
    'from-amber-400', 'via-yellow-500', 'to-orange-500',
    // Base que usamos em muitos lugares
    'bg-gradient-to-br', 'bg-gradient-to-r', 'bg-gradient-to-l', 'bg-gradient-to-b',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
