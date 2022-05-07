<!-- @format -->

<template>
  <div>
    <h1>接口(process.env.BIU_API)： {{ nowApi }}</h1>
    <h1>官网(process.env.BIU_SITE)： {{ nowSite }}</h1>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  const nowApi = ref(process.env.BIU_API);
  const nowSite = ref(process.env.BIU_SITE);
</script>
