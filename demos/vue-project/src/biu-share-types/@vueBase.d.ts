/** @format */

declare module '@vueBase/bootstrap' {
  /** @format */
  export {};
}
declare module '@vueBase/main' {
  /** @format */
}
declare module '@vueBase/components/comp-button' {
  /** @format */
  const _default: any;
  export default _default;
}
declare module '@vueBase/components/the-btn' {
  /** @format */
  const _default: any;
  export default _default;
}
declare module '@vueBase' {
  /** @format */
  export const theMoney = 10000;
  export const moneyFormat: (money: number) => string;
  import VueBaseCompButton from '@vueBase/components/CompButton.vue';
  export { VueBaseCompButton };
  import VueBaseTsxBtn from '@vueBase/components/the-btn';
  export { VueBaseTsxBtn };
}
