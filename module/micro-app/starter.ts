import { webApplication } from '../application';
import { MicroAppStartOptions } from './index';

if (window.__POWERED_BY_QIANKUN__) {
  // 动态设置 webpack publicPath，防止资源加载出错
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}

/**
 * bootstrap 只会在微应用初始化的时候调用一次，下次微应用重新进入时会直接调用 mount 钩子，不会再重复触发 bootstrap。
 * 通常可以在这里做一些全局变量的初始化，比如不会在 unmount 阶段被销毁的应用级别的缓存等。
 */
export async function bootstrap() {
  return;
}

/**
 * 应用每次进入都会调用 mount 方法，当前应用以子应用加载时，会在该位置调用webApplication.start启动应用
 */
export async function mount(options: MicroAppStartOptions) {
  if (!webApplication.isSubApp()) {
    console.error("micro app hasn't be init!");
    return;
  }
  return webApplication.microApp.mount(options);
}

/**
 * 可选生命周期钩子，仅使用 loadMicroApp 方式加载微应用时生效
 */
export async function update(_props) {
  return;
}

/**
 * 应用每次 切出/卸载 会调用的方法，通常在这里我们会卸载微应用的应用实例
 */
export async function unmount() {
  await webApplication.destroy();
}
