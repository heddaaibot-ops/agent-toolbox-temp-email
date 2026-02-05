/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Premium Purple Theme - 深沉高级紫
        glass: {
          purple: {
            50: '#1a0d2e',
            100: '#28184d',
            200: '#3d2463',
            300: '#523178',
            400: '#6b3fa0',
            500: '#7c4dbd',
            600: '#8b5fd9',
            700: '#9d73e8',
            800: '#b08bf5',
            900: '#c5a3ff',
          },
          emerald: {
            50: '#041f1a',
            100: '#0a3d2f',
            200: '#0f5943',
            300: '#15755a',
            400: '#1a9871',
            500: '#20ba88',
            600: '#2dd4a0',
            700: '#4de0b4',
            800: '#7de9c9',
            900: '#aff2de',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Space Grotesk', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        'glass-radial': 'radial-gradient(circle at 50% 0%, rgba(107, 63, 160, 0.2) 0%, transparent 50%)',
        'glass-mesh': 'linear-gradient(135deg, #0a0118 0%, #1a0d2e 40%, #28184d 70%, #3d2463 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(124, 77, 189, 0.25)',
        'glass-lg': '0 16px 48px 0 rgba(124, 77, 189, 0.35)',
        'glass-emerald': '0 8px 32px 0 rgba(32, 186, 136, 0.25)',
        'glass-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.06)',
      },
    },
  },
  plugins: [],
}
