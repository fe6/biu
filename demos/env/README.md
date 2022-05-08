<!-- @format -->

# 环境变量

在根目录设置环境文件，如 **.env.dev** 。若改变环境变量，重启后没发现变化，可清除(`rm -rf node_modules/.biu-cache`)缓存再试。

环境变量顺序为

1.  `.env.${env}.local`
2.  `.env.${env}`
3.  `.env.local`
4.  `.env`
