# 日志规范

> 项目内建 Logger 模块的使用规范。

---

## Logger 模块

项目内置日志系统（`src/modules/logger/`），支持多级别日志和可配置输出。

### 日志级别

| 级别 | 用途 |
|------|------|
| debug | 调试信息，仅开发环境 |
| info | 常规操作信息 |
| warn | 警告，非致命问题 |
| error | 错误，需要关注 |

### 使用方式

```typescript
import { createLogger } from '@mudssky/jsutils'

const logger = createLogger({ level: 'debug' })
logger.info('操作完成', { duration: 120 })
logger.warn('配置缺失，使用默认值')
logger.error('请求失败', error)
```

---

## 工具函数中的日志

工具函数本身**不应直接使用 logger**。日志输出由消费者决定。

例外：`console.warn` 可在高亮器等 DOM 工具中使用（如 `Highlighter` 对无效正则的警告）。

---

## 禁止的模式

- 禁止在工具函数中使用 `console.log` — 使用 `console.warn` 仅在必要时
- 禁止在库代码中输出敏感信息（密钥、token、个人信息）
