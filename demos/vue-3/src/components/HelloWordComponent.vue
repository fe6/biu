<!-- @format -->

<template>
  <h1>Hello Word</h1>
  <p>{{ msg }}</p>
</template>

<script lang="ts">
  export default {
    name: 'HelloWordComponent',
  };
</script>

<script lang="ts" setup>
  defineProps({
    msg: {
      type: String,
      default: '',
    },
  });
</script>

<style lang="less" scoped>
  h1 {
    font-size: 20px;
  }

  p {
    background-color: #f0f;
  }
</style>
