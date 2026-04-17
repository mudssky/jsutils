# Logger 使用示例

本示例展示了 jsutils 中 logger 模块的各种使用方法，包括基本日志记录、Error 对象处理和子日志记录器功能。

## 基本使用

```typescript
import { createLogger } from '@mudssky/jsutils'

// 创建基本日志记录器
const logger = createLogger({
  name: 'MyApp',
  level: 'info',
  enableFormat: true,
})

// 基本日志输出
logger.info('应用启动成功')
logger.warn('这是一个警告消息')
logger.error('发生了错误')
```

## Error 对象处理

```typescript
// Error 对象会被自动序列化，提取关键信息
try {
  throw new Error('数据库连接失败')
} catch (error) {
  // Error 对象作为消息
  logger.error(error)

  // Error 对象作为可选参数
  logger.error('操作失败', error, { userId: 123 })
}

// 嵌套 Error 对象处理
try {
  const cause = new Error('网络超时')
  throw new Error('请求失败', { cause })
} catch (error) {
  // 会递归处理 cause 属性中的 Error 对象
  logger.error('处理请求时出错', error)
}
```

## 子日志记录器 (Context-based)

```typescript
// 创建带有上下文的父日志记录器
const appLogger = createLogger({
  name: 'MyApp',
  level: 'info',
  context: {
    service: 'web-server',
    version: '1.0.0',
  },
})

// 创建子日志记录器，合并上下文
const userLogger = appLogger.child({
  module: 'user-service',
  userId: 12345,
})

// 子日志记录器会包含父级和自身的上下文
userLogger.info('用户登录成功')
// 输出: {"service":"web-server","version":"1.0.0","module":"user-service","userId":12345,"name":"MyApp","level":"info","message":"用户登录成功","timestamp":"2024-01-01T00:00:00.000Z"}

// 创建更深层的子日志记录器
const requestLogger = userLogger.child({
  requestId: 'req-abc123',
  ip: '192.168.1.1',
})

requestLogger.info('处理用户请求')
// 输出包含所有层级的上下文信息
```

## 自定义格式化器

```typescript
// 使用自定义格式化器
const customLogger = createLogger({
  name: 'CustomApp',
  level: 'debug',
  formatter: (level, message, ...params) => {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${params.length > 0 ? JSON.stringify(params) : ''}`
  },
})

customLogger.info('自定义格式的日志', { extra: 'data' })
// 输出: [2024-01-01T00:00:00.000Z] INFO: 自定义格式的日志 [{"extra":"data"}]
```

## 日志级别控制

```typescript
// 创建不同级别的日志记录器
const debugLogger = createLogger({ name: 'Debug', level: 'debug' })
const prodLogger = createLogger({ name: 'Prod', level: 'warn' })

// debug 级别会输出所有日志
debugLogger.debug('调试信息') // 会输出
debugLogger.info('普通信息') // 会输出
debugLogger.warn('警告信息') // 会输出

// warn 级别只会输出 warn 和 error
prodLogger.debug('调试信息') // 不会输出
prodLogger.info('普通信息') // 不会输出
prodLogger.warn('警告信息') // 会输出
prodLogger.error('错误信息') // 会输出
```

## 实际应用场景

### Web 应用日志记录

```typescript
// 应用主日志记录器
const appLogger = createLogger({
  name: 'WebApp',
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  context: {
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
})

// 不同模块的子日志记录器
const authLogger = appLogger.child({ module: 'auth' })
const dbLogger = appLogger.child({ module: 'database' })
const apiLogger = appLogger.child({ module: 'api' })

// 用户认证日志
authLogger.info('用户尝试登录', { username: 'john_doe' })
authLogger.error('登录失败', new Error('密码错误'), { username: 'john_doe' })

// 数据库操作日志
dbLogger.debug('执行查询', { sql: 'SELECT * FROM users' })
dbLogger.warn('查询耗时过长', { duration: 5000, sql: 'SELECT * FROM orders' })

// API 请求日志
const requestLogger = apiLogger.child({
  requestId: 'req-12345',
  method: 'POST',
  path: '/api/users',
})

requestLogger.info('开始处理请求')
requestLogger.info('请求处理完成', { statusCode: 200, duration: 150 })
```

### 错误追踪

```typescript
// 创建错误追踪日志记录器
const errorLogger = createLogger({
  name: 'ErrorTracker',
  level: 'error',
  context: {
    service: 'payment-service',
  },
})

// 处理支付错误
try {
  await processPayment(paymentData)
} catch (error) {
  const paymentLogger = errorLogger.child({
    orderId: paymentData.orderId,
    userId: paymentData.userId,
    amount: paymentData.amount,
  })

  paymentLogger.error('支付处理失败', error, {
    paymentMethod: paymentData.method,
    timestamp: new Date().toISOString(),
  })
}
```

## 注意事项

1. **上下文合并**: 子日志记录器会深度合并父级的 `context`，子级的同名属性会覆盖父级
2. **性能考虑**: 在高频调用场景下，建议关闭格式化 (`enableFormat: false`) 以提升性能
3. **Error 对象**: Error 对象会被自动序列化，包括 `message`、`stack`、`name` 和 `cause` 属性
4. **日志级别**: 按优先级排序为 `trace/log < debug < info < warn < error`
5. **灵活性**: `name` 属性不再自动拼接，可以通过 `context` 灵活控制日志结构
