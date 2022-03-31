<!-- @format -->

<template>
  <div>
    <h1>Vue html config app</h1>
    <div
      :style="{
        display: 'inline-block',
        width: '100px',
        height: '100px',
        background: `url(${LogoImage}) no-repeat`,
      }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
  import LogoImage from './logo.svg';
</script>

<style lang="less">
  body {
    padding: 10px;
    color: #f0f;
  }
</style>
