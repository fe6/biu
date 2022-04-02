<!-- @format -->

<template>
  <div class="base-btn">
    <button @click="theAdd">add</button>
    <p>{{ theValue }}</p>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'VueBaseCompButton',
  };
</script>

<script lang="ts" setup>
  import { ref } from 'vue';

  const theValue = ref(0);
  const theAdd = () => {
    theValue.value++;
  };
</script>

<style lang="scss" scoped>
  .base-btn {
    border: 1px solid #00f;
  }
</style>

<style lang="less" scoped>
  .base-btn {
    background: url(../assets/logo.svg) no-repeat;
  }
</style>

<style scoped>
  .base-btn {
    width: 300px;
    height: 300px;
  }
</style>
