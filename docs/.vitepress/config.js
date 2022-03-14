/** @format */

module.exports = {
  title: 'BIU',
  description: '可插拔的企业级应用程序框架',
  themeConfig: {
    repo: 'fe6/biu',
    // logo: '/logo.svg',
    docsDir: 'docs',
    docsBranch: 'next',
    editLinks: true,
    editLinkText: '修改这页内容',

    nav: [
      // { text: '指引', link: '/guide/' },
      { text: '开发', link: '/develop/' },
      { text: '配置', link: '/config/' },
      { text: '插件', link: '/plugin/' },
    ],

    sidebar: {
      // '/guide/': 'auto',
      '/develop/': 'auto',
      '/config/': 'auto',
      '/plugins/': 'auto',
    },
  },
};
