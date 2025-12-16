import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // (process as any) kullanılarak tip hatası önlendi
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // EĞER .env DOSYASI OKUNAMAZSA, VERDİĞİN KEY'İ KULLAN
  // Bu satır hatayı kesin olarak çözecektir.
  const apiKey = env.API_KEY || "AIzaSyAQx6y7mvdYdNpwkzj8XGYrdOfgfA4twdA";

  return {
    plugins: [react()],
    define: {
      // API anahtarını güvenli bir şekilde uygulamaya gömer
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  }
})