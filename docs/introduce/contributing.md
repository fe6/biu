<!-- @format -->

# 参与贡献

记录一下开发的相关事宜~

## 环境准备

### node 和 pnpm

开发 BIU 需要 node 16+ 和 pnpm。node 推荐用 nvm 安装，避免权限问题的同时还随时切换 node 版本；pnpm 去[他的官网](https://pnpm.io/installation)选择一种方式安装即可。

### Clone 项目

```bash
$ git clone git@github.com:fe6/biu.git
$ cd biu
```

### 安装依赖

```bash
$ pnpm i
```

## 常用任务

### 启动 start 命令

BIU 用 turbo 同时检测所有 packages 中 src 的变化。

本地开发 BIU 必开命令，用于编译 src 下的 TypeScript 文件到 dist 目录，同时监听文件变更，有变更时增量编译。

```bash
$ pnpm start
```

如果觉得比较慢，也可以只跑特定 pacakge 的 start 命令，比如。

```bash
$ cd packages/biu
$ pnpm start
```

### 跑 demo

demos 目录下保存了各种用于测试的例子，跑 demo 是开发 BIU 时确认功能正常的常用方式。每个 demo 都配了 start script，所以进入 demo 然后执行 `pnpm start` 即可。

```bash
$ cd demos/biu
$ pnpm start
```

### 文档

文档是 vitepress。

```bash
$ pnpm doc:dev
```

然后打开提示的端口号即可。

### 新增 package

新增 package 有封装脚本，无需手动复制 package.json 等文件。

- 一个命令搞定新 package

```bash
$ pnpm bootstrap biu
```

- 手动创建文件夹，自动生成新是 package 。分两步，1）创建目录 2）执行 `pnpm bootstrap`。

```bash
$ mkdir packages/foo
$ pnpm bootstrap
```

### 更新依赖

> 不推荐。

执行 `pnpm dep:update` 可更新依赖。

```bash
$ pnpm dep:update
```

由于 BIU 有针对依赖做预打包处理，更新依赖后还需检查更新的依赖是否为 devDependencies 并且有对此做依赖预打包。如果有，需要在对应 package 下执行 `pnpm build:deps` 并指定依赖，用于更新预打包的依赖文件。

```bash
$ pnpm build:deps --dep webpack-manifest-plugin
```

### 发布

TODO
