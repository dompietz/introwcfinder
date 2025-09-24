/// <reference types="vite/client" />

// Vue SFC shim (lets TS import .vue files)
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}
