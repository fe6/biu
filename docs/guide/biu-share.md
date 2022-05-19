<!-- @format -->

# 共享模式 {#biu-share}

随着前端微服务的兴起，市面上有很多微服务的解决方案。 BIU 也支持微服务的，具体配置如下。

## biuShare 介绍

- 实现 2 重共享模型
  - [基站] -> [引用]
- `biuShare` 与 `moduleFederation` 配置可以 `config.biuShare` 里面进行配置

- 注意!!! 在 `moduleFederation` 配置中,如果项目需要导出模块供其它项目使用,除了在 biuShare.exposes 中配置外,还需要在项目根目录中添加 `bootstrap.js` 或 `bootstrap.ts` 文件作为 webpack 导出模块的引导文件 [为什么?](https://webpack.docschina.org/concepts/module-federation/#troubleshooting) [如何配置?](https://github.com/fe6/biu/blob/master/demos/vue-base/src/main.ts)

## biuShare 配置

```js
// 基站配置
// .biurc.js
module.exports = {
  biuShare: {
    name: 'vueBase',
    exposes: {
      './Content': './src/components/Content',
      '.': './src/exposes/index',
    },
  },
};
```

```js
// 引用配置
// .biurc.js
module.exports = {
  biuShare: {
    name: 'vueProject',
    remotes: {
      '@vueBase': 'vueBase@http://localhost:1900/biu.js',
    },
  },
};
```
