import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  define: {
    // Ensure VITE_API_URL is available at build time
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version)
  }
})
