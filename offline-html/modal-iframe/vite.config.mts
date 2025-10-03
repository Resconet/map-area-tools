import { defineConfig } from 'vite'

export default defineConfig({
  base: '', // Use relative paths for dependencies
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js', // Prevent generating unique suffix to enable script update in Woodford Offline HTML storage
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      }
    }
  }
})
