<!-- @format -->

<template>
  <div>
    <h1>混合模式的环境变量</h1>
    <h2>接口(process.env.BIU_API)： {{ nowApi }}</h2>
    <h2>官网(process.env.BIU_SITE)： {{ nowSite }}</h2>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  const nowApi = ref(process.env.BIU_API);
  const nowSite = ref(process.env.BIU_SITE);
</script>
