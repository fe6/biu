<!-- @format -->

<template>
  <div class="base-btn">
    <button @click="theAdd">add</button>
    <p>{{ theValue }}</p>
  </div>
</template>

<!--
setup demo
<script lang="ts" setup>
import { ref } from 'vue';
const theValue = ref(0);
const theAdd = () => {
  theValue.value++;
};
</script>-->

<script lang="ts" src="./comp-button.ts"></script>
<style lang="less" src="./comp-button.less"></style>
