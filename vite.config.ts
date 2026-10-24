import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLively = mode === 'lively';
  const livelyPreset = process.env.LIVELY_PRESET || '';

  return {
    base: './',
    plugins: [react()],
    define: {
      __LIVELY_BUILD__: JSON.stringify(isLively),
      __LIVELY_PRESET__: JSON.stringify(livelyPreset),
    },
    build: isLively
      ? {
          outDir: 'dist-lively',
          emptyOutDir: true,
          copyPublicDir: false,
        }
      : undefined,
  };
  
});