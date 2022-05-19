<!-- @format -->

# 多页面模式 {#multi-entries}

假设你有下面这样的项目文件结构

```
├── package.json
├── .biurc.js
├── src
│   ├── App.vue
│   ├── bootstrap.ts
│   ├── index.html
│   ├── index.ts
│   ├── one
│   │   ├── App.vue
│   │   ├── bootstrap.ts
│   │   ├── index.ts
│   │   └── one.html
│   ├── shims-vue.d.ts
│   └── two
│       ├── App.vue
│       ├── bootstrap.ts
│       ├── index.ts
│       └── two.html
└── tsconfig.json
```

在开发过程中，简单地导航或链接到 `/one/` 或者 `/two/` - 将会按预期工作，与正常的静态文件服务器表现一致。

## 配置

::: tip
入口 j(t)s 文件必须名字必须是 index ，否则不起作用
:::

多页面模式配置 `.biurc.js` 如下:

```js
module.exports = {
  entries: {
    'index.ts': {
      title: '首页',
      template: 'src/index.html',
    },
    'one/index.ts': {
      title: '作品',
      template: 'src/one/one.html',
    },
    'two/index.ts': {
      title: '介绍',
      template: 'src/two/two.html',
    },
  },
};
```
