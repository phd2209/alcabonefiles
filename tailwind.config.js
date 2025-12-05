/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FBI Theme Colors
        'fbi-beige': '#D7C49E',
        'aged-brown': '#B79C72',
        'burnt-shadow': '#6E5A3E',
        'rust-red': '#9B2F2F',
        'noir-black': '#1B1B1B',
        'off-white': '#F4EEDB',
        'evidence-yellow': '#E7D47C',
        'ink-blue': '#121A3A',
        'burgundy': '#5A1E20',
      },
      fontFamily: {
        'heading': ['Bebas Neue', 'Oswald', 'Impact', 'sans-serif'],
        'typewriter': ['Special Elite', 'Courier New', 'monospace'],
        'body': ['Inter', 'Lato', 'sans-serif'],
      },
      backgroundImage: {
        'manila-texture': "url('/manila-texture.png')",
        'paper-texture': "url('/paper-texture.png')",
      },
    },
  },
  plugins: [],
}
