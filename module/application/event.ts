import { WebApplicationCls } from './application';
import _ from 'lodash';

/**
 * 应用事件类型
 */
export enum WebApplicationEventType {
  /**
   * 应用加载前
   */
  applicationStarting,
  /**
   * 模块加载前(所有模块)
   */
  moduleInstalling,
  /**
   * 模块加载完成(所有模块)
   */
  moduleInstalled,
  /**
   * 异步模块加载前（每个模块）
   */
  asyncModuleInstalling,
  /**
   * 异步模块加载完成（每个模块）
   */
  asyncModuleInstalled,
  /**
  * 远程配置加载前
  */
  configLoading,
  /**
   * 远程配置加载完成
   */
  configLoaded,
  /**
   * 路由对象创建中
   */
  routerLoading,
  /**
   * 路由对象创建后
   */
  routerCreated,
  /**
   * 路由加载完成
   */
  routerLoaded,
  /**
   * Vue生命周期钩子，根元素创建前
   */
  vueBeforeCreate,
  /**
   * Vue生命周期钩子，根元素创建完成后
   */
  vueCreated,
  /**
   * Vue生命周期钩子，根元素mount前
   */
  vueBeforeMount,
  /**
   * Vue生命周期钩子，根元素mount后
   */
  vueMounted,
  /**
   * 应用加载完成
   */
  applicationStarted,

  /**
   * 应用销毁前
   */
  applicationDestroying,
  /**
   * Vue生命周期钩子，根元素销毁前
   */
  vueBeforeDestroy,
  /**
   * Vue生命周期钩子，根元素销毁后
   */
  vueDestroyed,
  /**
   * 应用销毁后
   */
  applicationDestroyed,

  /**
   * 用户登录成功
   */
  userSignIn,
  /**
   * 用户注销
   */
  userSignOut,

  /**
   * 子应用创建时
   */
  microAppBoot,
  /**
   * 子应用加载时
   */
  microAppMount,
  /**
   * 微前端应用全局状态变化
   */
  microAppGlobalStateChange
}

export interface WebApplicationEventContext {
  /**
   * 当前应用
   */
  webApp: WebApplicationCls;
  /**
   * 其它参数
   */
  [propName: string]: any;
}

export interface WebApplicationEvent<T> {
  (context: T): void;
}

export interface NamedWebApplicationEvent<T> {
  name: string;
  handler: WebApplicationEvent<T>;
}

export class WebApplicationEventManager<K, T> {
  events = new Map<K, Array<NamedWebApplicationEvent<T>>>();
  add(type: K, event: WebApplicationEvent<T>): string {
    let typeEvents = this.events.get(type);
    if (!typeEvents) {
      typeEvents = new Array<NamedWebApplicationEvent<T>>();
      this.events.set(type, typeEvents);
    }
    let uid = _.uniqueId('event');
    typeEvents.push({
      name: uid,
      handler: event
    });
    return uid;
  }
  remove(type: K, uid: string) {
    let typeEvents = this.events.get(type);
    if (!typeEvents) {
      return;
    }
    let index = -1;
    _.forEach(typeEvents, (event, i) => {
      if (event.name == uid) {
        index = i;
        return false;
      }
      return true;
    });
    if (index > -1) {
      typeEvents.slice(index, 1);
    }
  }
  async dispatch(type: K, eventParams: T, invoker?: any) {
    let typeEvents = this.events.get(type);
    if (!typeEvents) {
      return;
    }
    if (!invoker) {
      invoker = {};
    }
    for (let event of typeEvents) {
      await event.handler.call(invoker, eventParams);
    }
  }
}
