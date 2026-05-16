# Zod 与 storage 模块组合调研

## 调研问题

`src/modules/storage` 是否适合搭配 Zod 使用？如果适合，应该作为核心依赖、可选 helper，还是业务层组合？

## 文档依据

使用 ctx7 查询 Zod 官方文档：

* `npx ctx7@latest library Zod "..."`
* `npx ctx7@latest docs /websites/zod_dev "..."`

文档重点：

* Zod 面向 TypeScript-first schema validation。
* `parse` 会校验输入并在失败时抛错。
* `safeParse` 返回 `{ success, data/error }` 结构，适合避免 `try/catch`。
* Zod schema 可以推导 TypeScript 类型，因此可以把运行时 schema 和编译期类型放在同一来源。

## 对当前 storage 模块的映射

当前 storage 模块使用 TypeScript 泛型 schema 约束 key 与 value 类型，这只能约束调用方在编译期写入/读取的类型。存储介质中的数据本身仍然是不可信的，可能来自旧版本、手工篡改、跨应用污染、JSON 解析失败后的兼容逻辑，或服务端/第三方写入。

因此 Zod 对 storage 是有价值的，但更适合在读取后对数据做运行时校验，而不是替代当前泛型 schema。

## 推荐结论

推荐采用“业务层可选组合”的方式：

* storage 核心继续保持轻量，不直接依赖 Zod。
* README 中说明 TypeScript schema 与 Zod 的分工。
* README 可给出 `safeParse` 示例，展示读取后校验和 fallback。
* 将来如果使用频率很高，再考虑新增独立 helper，例如 `storage-extras` 中的可选校验封装。

## 不推荐的方向

不建议当前直接把 Zod 加入 storage 核心：

* 会让基础存储模块承担运行时校验依赖。
* 会影响不需要 Zod 的使用者包体积和依赖心智。
* 当前 storage API 是跨 Web/Taro/Uni 的轻量抽象，内建 Zod 会扩大核心边界。

## 示例方向

README 可包含类似示例：

```ts
import { WebLocalStorage } from '@mudssky/jsutils'
import { z } from 'zod'

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
})

type AppStorageSchema = {
  user: z.infer<typeof userSchema>
}

const storage = new WebLocalStorage<AppStorageSchema>({
  prefix: 'app_',
})

const result = userSchema.safeParse(storage.getStorageSync('user'))
const user = result.success ? result.data : null
```
