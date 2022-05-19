<!-- @format -->

# 环境变量与模式 {#env-variables-and-modes}

## 环境变量 {#env-variables}

BIU 在一个特殊的 **`process.env`** 对象上暴露环境变量。这里有一些在所有情况下都可以使用的内建变量：

### `.env` 文件 {#env-files}

BIU 使用 [dotenv](https://github.com/motdotla/dotenv) 从你的 [环境目录](/config/#envdir) 中的下列文件加载额外的环境变量：

```
.env                # 所有情况下都会加载
.env.local          # 所有情况下都会加载，但会被 git 忽略
.env.[env]         # 只在指定模式下加载
.env.[env].local   # 只在指定模式下加载，但会被 git 忽略
```

:::tip 环境加载优先级

一份用于指定模式的文件（例如 `.env.prod`）会比通用形式的优先级更高（例如 `.env`）。

另外，BIU 执行时已经存在的环境变量有最高的优先级，不会被 `.env` 类文件覆盖。例如当运行 `BIU_SOME_KEY=123 vite build` 的时候。

`.env` 类文件会在 BIU 启动一开始时被加载，而改动会在重启服务器后生效。
:::

加载的环境变量也会通过 `process.env` 以字符串形式暴露给客户端源码。

为了防止意外地将一些环境变量泄漏到客户端，只有以 `BIU_` 为前缀的变量才会暴露给经过 vite 处理的代码。例如下面这个文件中：

```
DB_PASSWORD=foobar
BIU_SOME_KEY=123
```

只有 `BIU_SOME_KEY` 会被暴露为 `process.env.BIU_SOME_KEY` 提供给客户端源码，而 `DB_PASSWORD` 则不会。

如果你想自定义 env 变量的前缀，请参阅 [envPrefix](/config/index#envprefix)。

:::warning 安全注意事项

- `.env.*.local` 文件应是本地的，可以包含敏感变量。你应该将 `.local` 添加到你的 `.gitignore` 中，以避免它们被 git 检入。

- 由于任何暴露给 BIU 源码的变量最终都将出现在客户端包中，`BIU_*` 变量应该不包含任何敏感信息。
  :::

### 自定义环境变量 {#env-diy}

在 BIU 中可以自行定义不同的环境。一个典型的例子是，你可能希望有一个 “staging” (预发布|预上线) 环境，它应该具有类似于生产的行为，但环境变量与生产环境略有不同。

你可以通过传递 `--env` 选项标志来覆盖命令使用的默认模式。例如，如果你想为我们假设的 staging 模式构建应用：

```bash
biu build --env staging
```

为了使应用实现预期行为，我们还需要一个 `.env.staging` 文件：

```
# .env.staging
BIU_APP_TITLE=My App (staging)
```

现在，你的 staging 应用应该具有类似于生产的行为，但显示的标题与生产环境不同。

### TypeScript 的智能提示 {#intellisense}

默认情况下，BIU 在 [`biu/app.d.ts`](https://github.com/fe6/biu/blob/master/packages/biu/app.d.ts) 中为 `process.env` 提供了类型定义。随着在 `.env[mode]` 文件中自定义了越来越多的环境变量，你可能想要在代码中获取这些以 `BIU_` 为前缀的用户自定义环境变量的 TypeScript 智能提示。

要想做到这一点，你可以在 `src` 目录下创建一个 `env.d.ts` 文件，接着按下面这样增加 `ImportMetaEnv` 的定义：

```typescript
/// <reference types="biu/app" />

interface ImportMetaEnv {
  readonly BIU_APP_TITLE: string;
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## 模式 {#modes}

默认情况下，开发服务器 (`dev` 命令) 运行在 `development` (开发) 模式，而 `build` 命令则运行在 `production` (生产) 模式。

这意味着当执行 `biu build` 时，它会自动加载 `.env.production` 中可能存在的环境变量：

```
# .env.production
BIU_APP_TITLE=My App
```
