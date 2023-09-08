import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      // 添加别名，实现在测试时直接导入包的效果
      // 因为vitest不支持tsconfig里的path，所以这里要再配一遍
      '@mudssky/jsutil': path.resolve(__dirname, '.'),
    },
  },
})
