<!-- @format -->

# 构建生产版本 {#building-for-production}

当需要将应用部署到生产环境时，只需运行 `biu build` 命令。默认情况下，它使用 BIU 内置 html 模板作为其构建入口点，并生成能够静态部署的应用程序包。

## 公共基础路径 {#public-base-path}

- 相关内容：[静态资源处理](./assets)

如果你需要在嵌套的公共路径下部署项目，只需指定 [`base` 配置项](/config/#base)，然后所有资源的路径都将据此配置重写。

## Browser 兼容 {#polyfill}

### IE 浏览器

- babel-polyfill

如果在编译产物时没有做额外的兼容处理，又想要在`IE`上运行时。
需要在核心代码执行前加载额外的`polyfill`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script src="//yourhost/babel-polyfill.min.js"></script>
  </head>

  <body>
    <div id="biu-root"></div>
  </body>
</html>
```

某些特性，如 Proxy。babel-polyfill 并不会兼容，需要业务侧自己做处理。
babel-polyfill 兼容特性见 <a href="https://kangax.github.io/compat-table/es6/#ie11">[文档]</a>
