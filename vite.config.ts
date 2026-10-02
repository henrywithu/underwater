import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Shaders live in src/shaders as standalone .glsl files and are imported with ?raw,
  // so editing one hot-reloads the material that uses it.
  assetsInclude: ['**/*.glsl'],
  // Babylon lazy-loads its own shaders with dynamic import(). Pre-bundling splits
  // those into separate chunks with their own ShaderStore instance, so built-in
  // includes go missing at runtime. Serving the ES modules untouched avoids that.
  optimizeDeps: { exclude: ['@babylonjs/core'] },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
  },
  server: { host: true },
});
