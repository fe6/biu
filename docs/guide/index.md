<!-- @format -->

# 开始 {#getting-started}

## 总览 {#overview}

BIU 是一套解决方案，一套半黑盒的解决方案。可以快速的搭建一个项目，内置 webpack5 更快速更方便。

## 在线试用 BIU {#trying-biu-online}

TODO

## 创建第一个 BIU 项目 {#scaffolding-your-first-biu-project}

TODO

## 命令行界面 {#command-line-interface}

在安装了 BIU 的项目中，可以在 npm scripts 中使用 `biu` 可执行文件，或者直接使用 `npx biu` 运行它。下面是通过脚手架创建的 BIU 项目中默认的 npm scripts：

<!-- prettier-ignore -->
```json5
{
  "scripts": {
    "start": "biu dev", // 启动开发服务器
    "build": "biu build", // 为生产环境构建产物
    "serve": "biu serve" // 本地预览生产构建产物
  }
}
```
