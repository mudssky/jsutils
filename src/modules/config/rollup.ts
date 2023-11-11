/**
 * 分包策略，1.把node_modules中的内容单独打包
 * 按下面的方法在vite中配置
 *   build: {
      rollupOptions: {
        ...vendorRollupOption,
      },
    },
 */
export const vendorRollupOption = {
  output: {
    chunkFileNames: 'js/[name]-[hash].js', // 产生的 chunk 自定义命名
    entryFileNames: 'js/[name]-[hash].js', // 指定 chunks 的入口文件匹配模式
    assetFileNames: '[ext]/[name]-[hash].[ext]', // 自定义构建结果中的静态资源名称，资源文件像 字体，图片等
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    manualChunks(id: any) {
      if (id.includes('node_modules')) {
        return 'vendor'
      }
    },
  },
}
