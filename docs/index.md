---
home: true
# heroImage: /logo.svg
actionText: Get Started
actionLink: /guide/

altActionText: Learn More
altActionLink: /guide/why

features:
  - title: 🔑 可扩展
    details: BIU 实现了完整的生命周期，并使其插件化， BIU 内部功能也全由插件完成。此外还支持插件和插件集，以满足功能和垂直域的分层需求.
  - title: 🔑 面向未来
    details: 在满足需求的同时，我们也不会停止对新技术的探索。比如 modern mode、webpack@5、自动化 external 、 bundler less 等等.
  - title: 🔑 大量自研
    details: 包含微前端、组件打包、文档工具、请求库、hooks 库、数据流等，满足日常项目的周边需求.
  - title: 💡 微组件化
    details: 结合 webpack5 、 Module Federation 的丰富项目实战、建立三层共享模型
  - title: ⚡️ 快速构建重载
    details: 结合 SWC 进行 bundle 编译构建、提升整体构建速度.
  - title: 🛠️ 多功能模块支持
    details: 对 TypeScript 、 JSX 、 CSS 、 Less 、 Sass 等支持开箱即用。
  - title: 📦 优化的构建
    details: 可选 “多页应用”模式的预配置 webpack 构建.
  - title: 🔩 通用的插件
    details: 在开发和构建之间共享 webpack chain 插件接口.
  - title: 🔑 TS 重构项目
    details: 提供灵活的 api 、 Plugin 以及完整的类型提示.
  - title: 🔑 区块化
    details: 完善的区块市场，垂直业务场景.
  - title: 🔑 UI
    details: 一键添加区块.
  - title: 🔑 企业级
    details: 经过数百个项目的打磨，经得住考验.

footer: MIT Licensed | Copyright © 2022 Tian Yi
---

<!-- @format -->

<script setup>
import fetchReleaseTag from './.vitepress/theme/fetch-release-tag.js'
fetchReleaseTag()
</script>
