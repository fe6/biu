<!-- @format -->

<template>
  <div>
    <h1>Vue 3 Base</h1>
    <span>svg component:</span>
    <Logo style="width: 100px" />
    <span>svg image:</span>
    <div
      :style="{
        display: 'inline-block',
        width: '100px',
        height: '100px',
        background: `url(${LogoImage}) no-repeat`,
      }"
    ></div>
    <HelloWordComponent msg="这是 BIU ~" />
  </div>
</template>

<script lang="ts" setup>
  import Logo from './logo.svg?component';
  import LogoImage from './logo.svg';
  import HelloWordComponent from './components/HelloWordComponent.vue';
</script>

<style lang="less">
  body {
    padding: 10px;
  }
</style>
