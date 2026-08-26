import type { UserConfigExport } from '@tarojs/cli'

export default {
  logger: { quiet: false, stats: true },
  mini: {},
  h5: {
    // 手机浏览器上 DeviceMotion 需要安全上下文：
    // HTTPS=1 npm run dev:h5 时用自签证书起局域网 https。
    devServer: {
      host: true,
      https: process.env.HTTPS === '1',
    },
  },
} satisfies UserConfigExport<'vite'>
