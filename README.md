# jsutil

个人通用js函数库。采用typescript编写，打包为esm，cjs，umd 3种格式，并且含有类型声明，适合在typescript项目中使用。  
采用babel转义js，因此兼容性会比较好,但是性能会受到影响。  

## 安装

```shell
npm install @mudssky/jsutil
or
yarn add @mudssky/jsutil
or
pnpm add @mudssky/jsutil

```

## 使用方法

和lodash-es类似  
推荐使用esm的方式按需引入，这样可以借由tree shaking，减少最后的打包体积  

```ts
import { range } from '@mudssky/jsutil'
console.log(range(1, 10))
```

详细文档地址 <https://mudssky.github.io/jsutils/index.html>
