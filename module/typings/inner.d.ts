interface Window {
  // 配置入口
  config: string;
  // QIANKUN注入变量
  __POWERED_BY_QIANKUN__: boolean;
  __INJECTED_PUBLIC_PATH_BY_QIANKUN__: string;
  // 事件绑定
  detachEvent:any;
  attachEvent: any;
}
