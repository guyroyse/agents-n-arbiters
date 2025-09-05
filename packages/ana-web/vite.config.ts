import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      '@components': path.resolve('./src/components'),
      '@views': path.resolve('./src/views'),
      '@api': path.resolve('./src/api')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
