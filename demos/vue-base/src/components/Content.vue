<!-- @format -->

<template>
  <div>
    <p>CONTENT 路径引入 组件</p>
    <CompButton text-val="button components in content from import" />
  </div>
</template>

<script lang="ts" setup>
  import CompButton from './CompButton.vue';
</script>

<style>
  .v2box {
    font-size: 38px;
    color: green;
    font-weight: bold;
  }
  .button {
    width: 200px;
    padding: 20px 0;
  }
</style>
