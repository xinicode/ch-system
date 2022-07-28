import { WebApplicationCls } from './application';
import { RouteConfig } from 'vue-router';
import Vue, { Component, AsyncComponent, ComponentOptions } from 'vue';
import { LocaleMessage } from '../i18n/locale';

export type RouteConfigWithParent = { parentPathOrKey: RouteConfig[] };

/**
 * 用于标识一个Web模块
 */
export interface IWebModule {
  /**
   * Web模块的名称，用于唯一标识该Module
   */
  name: string;

  /**
   * 在Web应用中初始化模块的安装
   * @param webApp 所属在应用
   */
  install(webApp: WebApplicationCls): void;

  /**
   * 该模块依赖的模块,设置了依赖模块后，模块install过程，会优先调用依赖模块的install方法
   */
  dependencies: Array<string>;

  /**
   * 模块版本
   */
  version?: string;

  /**
   * 包含的路由列表
   */
  routes?: RouteConfigWithParent | RouteConfig[];

  /**
   * 包含的组件列表
   */
  components?: { [key: string]: Component<any, any, any, any> | AsyncComponent<any, any, any, any> };

  /**
   * 可对外提供mixins的对象
   */
  mixins?: (ComponentOptions<Vue> | typeof Vue)[];

  /**
   * 模块的多语言调协
   */
  locale?: LocaleMessage;

  /** 其它扩展属性 */
  [propName: string]: any;
}
