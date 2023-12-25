# jsutil

[![NPM version](https://img.shields.io/npm/v/@mudssky/jsutils.svg?style=flat)](https://npmjs.org/package/@mudssky/jsutils)
[![NPM downloads](http://img.shields.io/npm/dm/@mudssky/jsutils.svg?style=flat)](https://npmjs.org/package/@mudssky/jsutils)

个人通用js函数库。采用typescript编写，打包为esm，cjs，umd 3种格式，并且含有类型声明，适合在typescript项目中使用。  
umd模块使用了babel转义，兼容性会比较好，cjs和esm模块没有转义tsconfig target设为es2017，
因为现在用户一般项目里有打包工具，所以这边就不需要转义了。

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

[详细文档地址](https://mudssky.github.io/jsutils/index.html)
