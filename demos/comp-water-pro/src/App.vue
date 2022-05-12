<!-- @format -->

<template>
  <div>
    <h1>water pro demo</h1>
    <Button @click="btnClick">轻轻点一下</Button>
  </div>
</template>

<script lang="ts" setup>
  import { Modal, Button } from '@fe6/water-pro';

  const btnClick = () => {
    Modal.confirm({
      title: '温馨提示',
      content: '快来体验下 BIU 吧~',
    });
  };
</script>

<style lang="less">
  // Fix Modal.confirm 样式没有引入
  @import '@fe6/water-pro/lib/modal/style/index.less';

  body {
    padding: 10px;
    color: #f0f;
  }
</style>
