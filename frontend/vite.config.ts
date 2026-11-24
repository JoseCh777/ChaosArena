import { existsSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const localMedia = new URL('./media-local/', import.meta.url);

export default defineConfig(({ command, isPreview }) => ({
  define: {
    __LOCAL_MEDIA_FILES__: JSON.stringify(command === 'serve' && !isPreview && existsSync(localMedia)
      ? readdirSync(localMedia).filter(file => /\.(mp3|mp4)$/.test(file)).map(file => `media-local/${file}`)
      : []),
  },
  plugins: [react()],
  server: { proxy: { '/socket.io': { target: 'http://127.0.0.1:3001', ws: true } } },
}));
