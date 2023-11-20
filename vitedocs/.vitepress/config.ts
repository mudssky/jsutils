import fg from 'fast-glob'
import { basename } from 'path'
import type { DefaultTheme } from 'vitepress'
import { defineConfig } from 'vitepress'
import packageJson from '../../package.json'
interface IndexTree {
  [index: string]: {
    link: string
    items?: IndexTree
  }
}
const preifx = 'jsutils'
// 目录标题去除utils.前缀
function resolveTitle(title: string) {
  return title === preifx ? title : title.replace(`${preifx}.`, '')
}

// 将md文档列表转为树结构
function getTree(file: string, prefix: string, tree = {}) {
  const [cur, ...rest] = file.replace('.md', '').split('.')
  const curPath = prefix + cur
  if (!tree[curPath]) {
    tree[curPath] = {
      link: '/docs/' + curPath + '.md',
    }
  }
  if (rest.length > 0) {
    if (!tree[curPath].items) {
      tree[curPath].items = {}
    }
    getTree(rest.join('.'), curPath + '.', tree[curPath].items)
  }
}

// 将树结构转为目录数组
function treeToItems(tree: IndexTree) {
  const items: DefaultTheme.SidebarItem[] = []
  Object.keys(tree).forEach((key) => {
    const item: DefaultTheme.SidebarItem = {
      text: resolveTitle(key),
      link: tree[key].link,
    }
    if (tree[key].items) {
      if (!item.items) {
        item.items = []
      }
      item.items.push(...treeToItems(tree[key].items!))
    }
    items.push(item)
  })
  return items
}

const tree = fg
  .sync(['./vitedocs/docs/*.md'])
  .map((path) => basename(path))
  .reduce((tree, file) => {
    getTree(file, '', tree)
    return tree
  }, {})

const docs: DefaultTheme.SidebarItem[] = treeToItems(tree)
console.log({ tree, docs })

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Utilities',
  description: 'Documentations of @mudssky/jsutils',
  // base: '/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/docs/index' },
      { text: 'API', link: '/docs/utils' },
    ],

    sidebar: [
      {
        text: 'API',
        items: docs,
      },
    ],

    socialLinks: [{ icon: 'github', link: packageJson.homepage }],

    search: {
      provider: 'local',
    },
  },

  markdown: {
    theme: {
      light: 'light-plus',
      dark: 'github-dark',
    },
  },
})
