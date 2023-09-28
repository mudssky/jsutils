import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      // 作为npm包测试，测试生成的esm模块，因为不知为何不能生成测试报告，所以不用。
      // '@mudssky/jsutil': path.resolve(__dirname, '.'),

      // 添加别名，实现在测试时直接导入包的效果
      // 因为vitest不支持tsconfig里的path，所以这里要再配一遍
      // 映射到src的ts文件测试
      '@mudssky/jsutil': path.resolve(__dirname, './src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
    // reporters: ['html'],
    coverage: {
      enabled: true,
    },
  },
})
