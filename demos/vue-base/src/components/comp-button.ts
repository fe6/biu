/** @format */

import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const theValue = ref(0);
    const theAdd = () => {
      theValue.value++;
    };
    return {
      theValue,
      theAdd,
    };
  },
});
