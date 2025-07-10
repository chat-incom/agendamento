import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'], // Exclui lucide-react da otimização de dependências
  },
  // Ativa Source Maps no modo de desenvolvimento
  server: {
    sourcemap: true,
  },
  // Ativa Source Maps no build
  build: {
    sourcemap: true,
  },
});
