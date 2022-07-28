import { webApplication, WebApplicationEventType } from '../application';
import { Session, SessionDetail } from '../security';
import _ from 'lodash';
import { ComponentOptions } from 'vue';
import { Utils } from '../common/utils';

export type OnGlobalStateChangeCallback = (state: Record<string, any>, prevState: Record<string, any>) => void;

export type GlobalStateSetter = (state: Record<string, any>) => boolean;

export interface MicroAppStartOptions {
  // 名称，如："micro_app_name_1604649792787_771"
  name: string;
  // 全局状态变更订阅
  onGlobalStateChange?: (callback: OnGlobalStateChangeCallback, fireImmediately?: boolean) => void;

  // 更新全局状态信息
  setGlobalState?: GlobalStateSetter;

  // 启动容器,如：__qiankun_microapp_wrapper_for_xxxxx__
  container: Element;

  domElement: Element;
  // singleSpa 对象
  singleSpa: any;

  mountParcel: () => void;

  unmountSelf: () => void;

  // 已配置的路由模式
  routerMode?: string;
  //
  routerBase?: string;
  // 父应用登录成功后session
  session: SessionDetail;

  // 父应用登录方法
  doLogin?: (returnUrl: string, appName?: string) => void;
  // 父应用的注销方法
  doLogout?: (returnUrl: string, appName?: string) => void;

  /** 其它扩展属性 */
  [propName: string]: any;
}

export class MicroAppCls {
  publicPath: string;
  appSelector: string;
  startOptions: ComponentOptions<Vue>;
  microAppParams: MicroAppStartOptions;
  // 主应用状态更新器
  private globalStateSetter: GlobalStateSetter;

  constructor(_startOptions?: ComponentOptions<Vue>) {
    this.startOptions = _startOptions;
    this.appSelector = <string>_startOptions.el;
    this.publicPath = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
  }

  /**
   * 应用每次进入都会调用 mount 方法，当前应用以子应用加载时，会在该位置调用webApplication.start启动应用
   */
  async mount(options: MicroAppStartOptions) {
    this.microAppParams = options;
    this.globalStateSetter = options.setGlobalState;
    Session.setSessionDetail(options.session);
    //最先覆盖routerBase配置，保证ConfigHelper拿到正确的routerBase和routerMode
    webApplication.addConfig({ routerMode: options.routerMode, routerBase: options.routerBase });

    options.onGlobalStateChange((value, prev) => {
      webApplication.dispatchEvent(WebApplicationEventType.microAppGlobalStateChange, {
        webApp: webApplication,
        value,
        prev
      });
    });

    webApplication.registerEvent(WebApplicationEventType.routerLoading, ({ createOptions }: any) => {
      createOptions.base = options.routerBase;
    });
    if (this.appSelector && options.container) {
      this.startOptions.el = options.container ? options.container.querySelector(this.appSelector) : this.appSelector;
    }
    await webApplication.start(this.startOptions);
    // 抛出子应用挂载事件
    await webApplication.dispatchEvent(WebApplicationEventType.microAppMount, {
      webApp: webApplication,
      microApp: this
    });
  }

  /**
   * 重写应用的登录逻辑，跳转到主应用，由主应用进行登录
   * @param returnUrl 登录后，访问地址
   */
  doLogin(returnUrl) {
    returnUrl = returnUrl || '';
    let _routerBase = _.trimEnd(this.microAppParams.routerBase, '/');
    if (webApplication.routerHistoryMode()) {
      if (!_.startsWith(returnUrl, 'http')) {
        returnUrl = `${_routerBase}${returnUrl}`;
      } else {
        this.microAppParams.doLogin(returnUrl);
        return;
      }
    } else {
      returnUrl = `${this.microAppParams.routerBase}#${returnUrl}`;
    }
    this.microAppParams.doLogin(returnUrl, _routerBase);
  }

  doLogout(returnUrl) {
    returnUrl = returnUrl || '';
    let _routerBase = _.trimEnd(this.microAppParams.routerBase, '/');
    if (webApplication.routerHistoryMode()) {
      if (!_.startsWith(returnUrl, 'http')) {
        returnUrl = `${_routerBase}${returnUrl}`;
      } else {
        this.microAppParams.doLogout(returnUrl);
        return;
      }
    } else {
      returnUrl = `${this.microAppParams.routerBase}#${returnUrl}`;
    }
    this.microAppParams.doLogout(returnUrl, _routerBase);
  }

  /**
   * 根据子应用内的publicPath重算访问地址
   */
  rebuildUrlInSubApp(_url) {
    _url = _url || '';
    if (this.publicPath) {
      _url = Utils.mergePath(this.publicPath, _url);
    }
    return _url;
  }

  /**
   * 通知父应用状态变化：按一级属性设置全局状态，微应用中只能修改已存在的一级属性
   * @param {全局状态} state
   */
  setGlobalState(state) {
    if (this.globalStateSetter) {
      this.globalStateSetter(state);
    } else {
      console.error('has not set globalStateSetter ');
    }
  }
}
