/** @format */

declare module '@vueBase/bootstrap' {
  export {};
}

declare module '@vueBase/main' {}

declare module '@vueBase/components/comp-button' {
  const _default: any;
  export default _default;
}

declare module '@vueBase/components/the-btn' {
  const _default: any;
  export default _default;
}

declare module '@vueBase' {
  export const theMoney = 10000;
  export const moneyFormat: (money: number) => string;
  import VueBaseContent from '@vueBase/components/Content.vue';
  export { VueBaseContent };
  import VueBaseCompButton from '@vueBase/components/CompButton.vue';
  export { VueBaseCompButton };
  import VueBaseTsxBtn from '@vueBase/components/the-btn';
  export { VueBaseTsxBtn };
}

declare module '@vueBase/Content' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<
    Record<string, never>,
    Record<string, never>,
    unknown
  >;
  export default component;
}
