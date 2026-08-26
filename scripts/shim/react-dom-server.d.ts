/**
 * react-dom 没给 server.browser 出类型。冒烟测试必须走浏览器版：
 * node 版会 require('stream')，esbuild 打成 ESM 后跑不起来。
 */
declare module 'react-dom/server.browser' {
  import type { ReactNode } from 'react'
  export function renderToStaticMarkup(node: ReactNode): string
}
