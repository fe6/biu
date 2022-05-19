/** @format */

module.exports = {
  title: 'BIU',
  description: '可插拔的企业级应用程序框架',
  themeConfig: {
    repo: 'fe6/biu',
    // logo: '/logo.svg',
    docsDir: 'docs',
    docsBranch: 'next',

    nav: [
      { text: '指引', link: '/guide/' },
      { text: '配置', link: '/config/' },
    ],

    sidebar: {
      '/': [
        {
          text: '指引',
          children: [
            {
              text: '为什么选 BIU',
              link: '/guide/why',
            },
            {
              text: '开始',
              link: '/guide/',
            },
            {
              text: '命令',
              link: '/guide/cmd',
            },
            {
              text: '静态资源处理',
              link: '/guide/assets',
            },
            {
              text: 'Typescript',
              link: '/guide/typescript',
            },
            {
              text: '构建生产版本',
              link: '/guide/build',
            },
            {
              text: '共享',
              link: '/guide/biu-share',
            },
            {
              text: '环境变量与模式',
              link: '/guide/env-and-mode',
            },
            {
              text: 'HTML 配置',
              link: '/guide/html',
            },
            {
              text: '多页面',
              link: '/guide/multi-entries',
            },
          ],
        },
        {
          text: 'API',
          children: [
            {
              text: '配置参考',
              link: '/config/',
            },
          ],
        },
      ],
      '/config/': 'auto',
    },
  },
};
