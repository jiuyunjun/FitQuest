import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// DeviceMotionEvent 只在安全上下文可用：localhost 走 http 即可，
// 用手机通过局域网 IP 访问时必须是 https，所以 dev:https 挂自签证书。
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: { host: true },
}))
