import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

/**
 * designWidth 375 而不是模板默认的 750：
 * FitQuest 的样式全部写在 React 的 inline style 里（数字 = CSS px），
 * 而 pxtransform 只处理 .css 文件。设成 375 让两者换算一致 ——
 * 1px 写在哪里都是 375pt 屏上的 1 个 CSS 像素，跟 H5 完全对齐。
 */
export default defineConfig<'vite'>(async (merge, { mode }) => {
  const baseConfig: UserConfigExport<'vite'> = {
    projectName: 'fitquest',
    date: '2026-8-26',
    designWidth: 375,
    deviceRatio: { 375: 2, 640: 2.34 / 2, 750: 1, 828: 1.81 / 2 },
    sourceRoot: 'src',
    outputRoot: `dist/${process.env.TARO_ENV}`,
    plugins: [],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: { type: 'vite' },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        // url 插件保持关闭：vite-runner 按 'url' 这个名字去 resolve，
        // 会命中 npm 上的 url polyfill 包而不是 postcss-url，每次构建报
        // 「TypeError: require(...) is not a function」。
        // FitQuest 没有任何图片资源（精灵全是 View 方块），本来就用不上它。
        // 将来真加了图片：npm i -D postcss-url，再把这里打开。
        url: { enable: false },
        cssModules: { enable: false },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        autoprefixer: { enable: true, config: {} },
        cssModules: { enable: false },
      },
    },
  }

  process.env.BROWSERSLIST_ENV = process.env.NODE_ENV

  if (mode === 'development') return merge({}, baseConfig, devConfig)
  return merge({}, baseConfig, prodConfig)
})
