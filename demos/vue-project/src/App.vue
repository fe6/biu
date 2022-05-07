<!-- @format -->

<template>
  <div>
    <h1>Vue Project App</h1>
    <p>vueBase 中的方法及常量： {{ moneyFormat(theMoney) }}</p>
    <VueBaseCompButton />
    1<VueBaseTsxBtn />1 // TODO
    <p>✅ 1. 暂时不支持路径引入( @vueBase/xxx )只支持根路径引入 (@vueBase)</p>
    <p>2. vue 文件样式在使用的时候没了</p>
    <p>3. tsx 还react编译呢</p>
    <p>4. 有 remotes 不热刷新了</p>
    <p>5. 'fs' 替换</p>
    <p>
      ERROR in ./src/App.vue Module build failed (from
      ../../packages/deps-webpack/compiled/vue-loader/index.js): TypeError:
      j.gray is not a function at formatError
      (/Users/lee/lee/github/water/biu/packages/deps-webpack/compiled/vue-loader/index.js:16:1849370)
      at
      /Users/lee/lee/github/water/biu/packages/deps-webpack/compiled/vue-loader/index.js:16:1851382
      at Array.forEach (anonymous) at Object.loader
      (/Users/lee/lee/github/water/biu/packages/deps-webpack/compiled/vue-loader/index.js:16:1851351)
    </p>
    <p>
      http://localhost:1901/Users/lee/lee/github/water/biu/packages/deps-webpack/compiled/vue-loader/index.js
    </p>
  </div>
</template>

<script lang="ts" setup>
  // TODO 暂时不支持路径引入( @vueBase/xxx )只支持根路径引入 (@vueBase)
  import {
    moneyFormat,
    theMoney,
    VueBaseCompButton,
    VueBaseTsxBtn,
  } from '@vueBase';
  console.log(VueBaseCompButton, 'v');
  console.log(VueBaseTsxBtn, 'VueBaseTsxBtn');
</script>
