<!-- @format -->

<template>
  <div>
    <h1>Vue Base App</h1>
    <CompButton />
    <TexBtn />
  </div>
</template>

<script lang="ts" setup>
  import CompButton from './components/CompButton.vue';
  import TexBtn from './components/the-btn';
</script>

<style lang="less">
  body {
    padding: 10px;
    color: #f0f;
  }
</style>
