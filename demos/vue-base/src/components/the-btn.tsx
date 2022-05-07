/** @format */

import { defineComponent, ref } from 'vue';
import style from './the-btn.module.less';

export default defineComponent({
  setup() {
    const num = ref(0);
    const addOne = () => {
      ++num.value;
    };
    return () => (
      <button
        class={style.thebtn}
        style={{
          color: 'red',
        }}
        onClick={addOne}>
        按钮按了 {num.value} 次
      </button>
    );
  },
});
