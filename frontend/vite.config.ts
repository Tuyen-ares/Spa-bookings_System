import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Debug: Log environment loading
    console.log('Vite Config - Loading environment variables:', {
        mode,
        hasGEMINI_API_KEY: !!env.GEMINI_API_KEY,
        keyLength: env.GEMINI_API_KEY?.length || 0
    });
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true, // Không tự động chuyển sang port khác nếu port 3000 bị chiếm
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
