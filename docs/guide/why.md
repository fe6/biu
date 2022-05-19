<!-- @format -->

# 为什么 BIU {#why}

## 💡 解决的问题 {#problems-solved}

- HTML 模板的真正定制
  - 支持注入 JS 、 CSS 等
  - 动态更改 TITLE 等
  - 支持 ajax 请求模板
- 环境变量
  - 支持 文件夹 配置
  - 支持 ajax 请求 json 配置文件
- 专注企业级微前端
  - 目前只支持网站的构建，微前端，( empShare 、 module federation )
  - REACT 17+ 、 VUE 3
  - 多页面模式
  - 可作为基座，暴露组件等，也可单独运行。
  - esm 及共享
  - d.ts 同步协助，一键生成同步
- 依赖
  - 依赖本地化，降低风险系数

## ⚡️ 版本定位 {#version-positioning}

- 公共的业务模块不在用 sub git ， npm
- 组件，各种钩子，各种辅助方法，ajax 统一初始化等业务方面的最佳实践及更好的管理
- 一体化，私有部署的最佳实践

## 📦 特有功能 {#unique-function}

- 实现 `biushare` 2 级共享模型
- 重写 `d.ts` 生成于同步逻辑，实现跨业务开发的自动同步体验
- 基于 `swc` 深度定制 `js`与`ts` loader，实现更加高效的开发体验
- 基于 `esbuild` 打包 `tsx` 与 `jsx`
