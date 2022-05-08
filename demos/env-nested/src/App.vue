<!-- @format -->

<template>
  <div>
    <h1>环境变量文件夹设置</h1>
    <p>目前在 ./envs 文件夹中</p>
    <h2>接口(process.env.BIU_API)： {{ nowApi }}</h2>
    <h2>官网(process.env.BIU_SITE)： {{ nowSite }}</h2>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  const nowApi = ref(process.env.BIU_API);
  const nowSite = ref(process.env.BIU_SITE);
</script>
