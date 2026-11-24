import { existsSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const localMedia = new URL('./media-local/', import.meta.url);
const publishedMedia = new URL('./public/media-local/', import.meta.url);
const mediaFiles = (directory: URL) => existsSync(directory)
  ? readdirSync(directory).filter(file => /\.(mp3|mp4|m4a)$/.test(file)).map(file => `media-local/${file}`)
  : [];

export default defineConfig(({ command, isPreview }) => ({
  define: {
    __LOCAL_MEDIA_FILES__: JSON.stringify([...new Set([
      ...mediaFiles(publishedMedia),
      ...(command === 'serve' && !isPreview ? mediaFiles(localMedia) : []),
    ])]),
  },
  plugins: [react()],
  server: { proxy: { '/socket.io': { target: 'http://127.0.0.1:3001', ws: true } } },
}));
