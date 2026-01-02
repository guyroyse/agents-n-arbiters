import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      '@app': path.resolve('./src/app'),
      '@views': path.resolve('./src/views'),
      '@components': path.resolve('./src/components'),
      '@services': path.resolve('./src/services'),
      '@api-types': path.resolve('./src/types')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
