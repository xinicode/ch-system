import Vue from 'vue';

export interface VueEx extends Vue {
  $Modal: any;
}

export interface ApplicationContext {
  /**
   * 获取当前应用上下文
   */
  getContext(): ApplicationContext;
  /**
   * 获取当前运行的Vue对象
   */
  getCurrentVue(): Vue;
}
