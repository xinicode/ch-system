/* eslint-disable @typescript-eslint/ban-types */
import Vue, { ComponentOptions, VueConstructor, PluginObject, PluginFunction } from 'vue';
import { ApplicationContext } from './context';
import VueRouter, { RouteConfig, Route } from 'vue-router';
import _ from 'lodash';
import { IWebModule, RouteConfigWithParent } from './module';
import { ConfigHelper, ConfigCls, AppConfig } from '../config';
import {
  WebApplicationEventManager,
  WebApplicationEventType,
  WebApplicationEvent,
  WebApplicationEventContext
} from './event';
import { ImportModule } from '../common/import-module';
import Vuex, { Store } from 'vuex';
import { Session, ILoginInterceptor } from '../security/session';
import querystring from 'query-string';
import { HttpRequest } from '../http';
import { RouteManager } from '../route/route';
import VueI18n from 'vue-i18n';
import { LocaleMessage, LocaleManager } from '../i18n/locale';

import { MicroAppCls } from '../micro-app';
import VueCompositionAPI from '@vue/composition-api';

import { RouteSecurityPolicy, RSPolicy } from '../security/route-security';

export class WebApplicationCls implements ApplicationContext {
  /**
   * 用于标识对象为是WebApplication
   */
  public _BINGO_UI_WEB_APPLICATIOIN = true;

  public NODE_ENV = window['_INDEX_ENV_'] || 'production';
  /**
   * 当前应用的的根元素
   */
  private _root: Vue;
  /**
   * Vue实例创建选项
   */
  private _vueOptions: ComponentOptions<Vue> = {
    el: '#app'
  };
  /**
   * 获取vuex的store对象
   */
  private _store: Store<string>;
  /**
   *所有注册的模块
   */
  private _modules = new Array<IWebModule>();
  /**
   * 当前应用的所有路由
   */
  private _routeManager = new RouteManager();
  /**
   * 管理应用自定义的路由权限策略
   */
  private _routeSecurityPolicy = new RouteSecurityPolicy();
  /**
   * 事件管理器
   */
  private _events = new WebApplicationEventManager<WebApplicationEventType, WebApplicationEventContext>();

  /**
   * 当前正在添加模块注册的事件
   */
  private _moduleEvents = null;

  private _mixins: Array<typeof Vue | ComponentOptions<Vue>> = [];

  private _frameId: string;

  private _localeManager = new LocaleManager();

  private _started = false;

  // 作为微服务时的子应用
  public microApp: MicroAppCls;

  get root(): Vue {
    return this._root;
  }
  get Vue(): VueConstructor {
    return Vue;
  }
  get routes(): Array<RouteConfig> {
    return this._routeManager.routes;
  }
  get config(): AppConfig {
    return ConfigHelper.items();
  }
  get configHelper(): ConfigCls {
    return ConfigHelper;
  }
  get store(): Store<string> {
    return this._store;
  }
  get router(): VueRouter {
    return this._vueOptions.router;
  }
  get routeManager(): RouteManager {
    return this._routeManager;
  }
  get modules(): Array<IWebModule> {
    return this._modules;
  }

  get frameId(): string {
    return this._frameId;
  }

  get i18n(): VueI18n {
    return <VueI18n>this._vueOptions.i18n;
  }

  get localeMessages(): LocaleMessage {
    return this._localeManager.messages;
  }

  get vueOptions(): ComponentOptions<Vue> {
    return this._vueOptions;
  }

  get started() {
    return this._started;
  }

  initMixin() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let app = this;
    this._mixins = [];
    // 添加mixins
    this._mixins.push({
      beforeCreate: async function() {
        await app.dispatchEvent(
          WebApplicationEventType.vueBeforeCreate,
          {
            webApp: app
          },
          this
        );
      },
      created: async function() {
        app.chkInFrame(this);
        await app.dispatchEvent(
          WebApplicationEventType.vueCreated,
          {
            webApp: app
          },
          this
        );
      },
      beforeMount: async function() {
        await app.dispatchEvent(
          WebApplicationEventType.vueBeforeMount,
          {
            webApp: app
          },
          this
        );
      },
      mounted: async function() {
        await app.dispatchEvent(
          WebApplicationEventType.vueMounted,
          {
            webApp: app
          },
          this
        );
      },
      destroyed: async function() {
        await app.dispatchEvent(
          WebApplicationEventType.vueDestroyed,
          {
            webApp: app
          },
          this
        );
      }
    });
  }

  constructor() {
    // 添加默认插件
    Vue.use(VueRouter);
    Vue.use(Vuex);
    Vue.use(VueI18n);
    //开始使用组合式api功能，后续升级到vue 2.7时，可以去掉，然后可以渐进升级到vue 3
    Vue.use(VueCompositionAPI);
    // 修复vue-router重复路由报错问题
    const originalPush = VueRouter.prototype.push;
    VueRouter.prototype.push = function push(location) {
      return originalPush.call(this, location).catch((err) => {
        if (!err) {
          return;
        }
        if (err.name === 'NavigationDuplicated') {
          console.log('NavigationDuplicated');
          return;
        }
        throw err;
      });
    };
    // 注册对象
    if (!Vue.prototype.$http) {
      Object.defineProperty(Vue.prototype, '$http', {
        get: function() {
          return new HttpRequest();
        },
        enumerable: true
      });
    }
    this.initMixin();
  }

  getContext(): ApplicationContext {
    return this;
  }

  getCurrentVue(): Vue {
    return this._root;
  }

  /**
   * 根据模块名，获取已添加的模块
   * @param name 模块名
   */
  getModule(name: string): IWebModule {
    let matched: IWebModule;
    for (let module of this._modules) {
      if (module.name == name) {
        matched = module;
        break;
      }
    }
    return matched;
  }

  /**
   * 当前应用是否做为微服务的子应用模式运行
   */
  isSubApp(): boolean {
    return this.microApp != null;
  }

  /**
   * 判断是否运行在微前端模式
   */
  powerByMicroApp(): boolean {
    return window.__POWERED_BY_QIANKUN__;
  }

  /**
   * 子应用内，计算url相对于子应用的基础地址的绝对地址
   */
  rebuildUrlInSubApp(url: string) {
    if (this.isSubApp()) {
      return this.microApp.rebuildUrlInSubApp(url);
    }
    return url;
  }
  /**
   * 判断路由是否为history模式
   */
  routerHistoryMode(): boolean {
    return ConfigHelper.isHistoryRouter();
  }

  /**
   * 添加启动项参数，参数以合并的方式，添加到原来参数中
   * @param options 启动项
   */
  addOptions(options?: ComponentOptions<Vue>): WebApplicationCls {
    if (options) {
      if (options.mixins) {
        this._mixins = this._mixins.concat(options.mixins);
        delete options.mixins;
      }
      this._vueOptions = _.assign(this._vueOptions, options);
    }
    return this;
  }

  addLocaleMessages(messages: LocaleMessage): WebApplicationCls {
    this._localeManager.addLocaleMessage(messages);
    return this;
  }

  /**
   * 添加Vue插件
   * @param plugin Vue插件名
   * @param options 插件参数
   */
  use<T>(plugin: PluginObject<T> | PluginFunction<T>, options?: T): WebApplicationCls {
    Vue.use(plugin, options);
    return this;
  }

  /**
   * 添加mixin
   * @param mixin vue 的mixin对象
   */
  mixin(mixin: typeof Vue | ComponentOptions<Vue>): WebApplicationCls {
    this._mixins.push(mixin);
    return this;
  }

  /**
   * 设置环境运行的模式
   * @param env 设置运行模式
   */
  nodeEnv(env): WebApplicationCls {
    this.NODE_ENV = env;
    if (this.NODE_ENV == 'development') {
      Vue.config.devtools = true;
    } else {
      Vue.config.devtools = false;
    }
    return this;
  }

  /**
   * 添加外部配置
   * @param cfg 外部配置
   */
  addConfig(cfg: AppConfig): WebApplicationCls {
    ConfigHelper.addAll(cfg);
    return this;
  }

  /**
   * 启动应用
   * @param options 根据配置参数启动应用
   */
  async start(options?: ComponentOptions<Vue>) {
    // 判断是否是需要使用子应用模式启动
    if (this.powerByMicroApp() && !this.microApp) {
      this.microApp = new MicroAppCls(options);
      return;
    }

    this._store = new Vuex.Store({});
    this._vueOptions.store = this._store;

    this.addOptions(options);

    // 用于浏览器端自动导入模块
    ImportModule.importModuleFromScripts();

    let _context: WebApplicationEventContext = {
      webApp: this
    };

    await this.dispatchEvent(WebApplicationEventType.applicationStarting, _context);

    //安装模块
    await this.installModules();

    //加载服务端配置
    await this.dispatchEvent(WebApplicationEventType.configLoading, _context);
    await ConfigHelper.loadServerConfig();
    await this.dispatchEvent(WebApplicationEventType.configLoaded, _context);

    //创建i18n对象
    this._vueOptions.i18n = new VueI18n({
      locale: this.config.locale || 'zh-CN',
      messages: this._localeManager.messages
    });

    //加载路由数据
    await this.buildRouter();

    this._started = true;
    //重新调用session的OnSign事件
    let session = Session.getSessionDetail();
    if (!session.anonymous) {
      Session.setSessionDetail(session);
    }

    //创建Vue应用
    this.createApp();

    //完成应用启动
    await this.dispatchEvent(WebApplicationEventType.applicationStarted, _context);
  }

  /**
   * 应用卸载：做一些清理操作
   */
  async destroy() {
    let _context: WebApplicationEventContext = {
      webApp: this
    };
    await this.dispatchEvent(WebApplicationEventType.applicationDestroying, _context);
    this._root.$destroy();
    this._root.$el.innerHTML = '';
    this._root = null;
    this._vueOptions.router = null;
    this.initMixin();
    this._routeManager.destroy();
    this._routeSecurityPolicy.destroy();
    this._started = false;
    //清空事件
    await this.dispatchEvent(WebApplicationEventType.applicationDestroyed, _context);
    this._events = new WebApplicationEventManager<WebApplicationEventType, WebApplicationEventContext>();
  }

  /**
   * 重启应用
   */
  reload() {
    this._root.$destroy();
    this.start();
  }

  private async buildRouter(): Promise<VueRouter> {
    //routerMode根据settings的配置使用history或者hash
    let routerParams = {
      base: ConfigHelper.getConfigVal('routerBase') || '/',
      mode: ConfigHelper.getConfigVal('routerMode') || 'hash',
      routes: this.routes,
      stringifyQuery: null
    };
    let stringifyQueries: Function[] = [];
    await this.dispatchEvent(WebApplicationEventType.routerLoading, {
      webApp: this,
      createOptions: routerParams,
      stringifyQueries
    });

    if (!_.isEmpty(stringifyQueries)) {
      routerParams.stringifyQuery = function(obj) {
        let queryParams = Object.assign({}, obj);
        _.forEach(stringifyQueries, (sq) => {
          let resq = sq(queryParams, obj);
          if (resq) {
            queryParams = resq;
          }
        });
        let res = querystring.stringify(queryParams);
        return res ? '?' + res : '';
      };
    }

    // 应用路由重载数据
    this._routeManager.applyOverrideRoutes();
    routerParams.routes = this.routes;

    let router = new VueRouter(routerParams);
    this._routeManager.setRouter(router);
    await this.dispatchEvent(WebApplicationEventType.routerCreated, { webApp: this, router: router });

    router.beforeEach((to, from, next) => {
      if (this.inIframe()) {
        to.query._pst = 'sh';
      }
      Session.doFilter(to, from, next);
    });
    this._vueOptions.router = router;
    await this.dispatchEvent(WebApplicationEventType.routerLoaded, { webApp: this, router: router });

    return router;
  }

  /**
   * 注册路由
   * @param routes 路由定义
   */
  addRoutes(routes: RouteConfig[], parent?: string): WebApplicationCls {
    if (this._started) {
      this._routeManager.addRoutesForRuntime(routes, parent);
    } else {
      this._routeManager.addRoutes(routes, parent);
    }
    return this;
  }

  /**
   * 添加模块
   * @param module 模块定义
   * @param unshift 是否在头部插入模块，默认在尾部插入模块
   */
  addModule(module: IWebModule, unshift?: boolean): WebApplicationCls {
    if (unshift) {
      this._modules.unshift(module);
    } else {
      this._modules.push(module);
    }
    // if (this._started) {
    //   this._processModuleInstall(module);
    // }
    return this;
  }
  /**
   * 移除指定模块名称的模块：这里仅仅移除模块数组中的元素，模块install方法产生的副作用或者模块本身代码的副作用无法移除，如果模块有uninstall方法会被调用
   * @param moduleName 模块名称
   * @returns 当前webApplication
   */
  removeModule(moduleName: string): WebApplicationCls {
    let removedModules = _.remove(this._modules, (m) => {
      return m.name === moduleName;
    });
    if (removedModules.length && removedModules[0].uninstall) {
      removedModules[0].uninstall(this);
    }
    return this;
  }

  /**
   *
   * @param type 事件类型
   * @param handler 注册事件
   */
  registerEvent(
    type: WebApplicationEventType,
    handler: WebApplicationEvent<WebApplicationEventContext> | ILoginInterceptor
  ): WebApplicationCls {
    if (type == WebApplicationEventType.userSignIn) {
      Session.onSignIn(<ILoginInterceptor>handler);
    } else if (type == WebApplicationEventType.userSignOut) {
      Session.onSignOut(<ILoginInterceptor>handler);
    } else {
      this._events.add(type, <WebApplicationEvent<WebApplicationEventContext>>handler);
    }

    if (this._moduleEvents != null) {
      this._moduleEvents.add(type, <WebApplicationEvent<WebApplicationEventContext>>handler);
    }
    return this;
  }

  removeEvent(type: WebApplicationEventType, uid: string): WebApplicationCls {
    this._events.remove(type, uid);
    return this;
  }

  private chkInFrame(vueObj: any) {
    let qmark = window.location.href.lastIndexOf('?');
    let params: any = {};
    if (qmark > 0) {
      params = querystring.parse(window.location.href.substr(qmark + 1));
      if (vueObj.$route.name == 'ssoclient' && params.returnUrl) {
        qmark = params.returnUrl.lastIndexOf('?');
        params = querystring.parse(params.returnUrl.substr(qmark + 1));
      }
    }
    this._frameId = vueObj.$route.query['_iframeId'] || params['_iframeId'];
  }

  inIframe(): boolean {
    return !!this._frameId;
  }

  /**
   * 向父窗口发送数据
   * @param data 发送数据
   * @param targetOrigin 源
   */
  postMessageToParent(data: any, targetOrigin?: string) {
    let eventData = Object.assign(data, {
      iframeId: this._frameId
    });
    if (!targetOrigin) {
      targetOrigin = '*';
    }
    window.parent.postMessage(eventData, targetOrigin);
  }

  private createApp() {
    this._root = new Vue(
      _.assign(this._vueOptions, {
        mixins: this._mixins
      })
    );
    return this._root;
  }

  async dispatchEvent(type: WebApplicationEventType, ctx: WebApplicationEventContext, invoker?: any) {
    if (!invoker) {
      invoker = this;
    }
    await this._events.dispatch(type, ctx, invoker);
  }

  private async installModules() {
    await this.dispatchEvent(WebApplicationEventType.moduleInstalling, {
      webApp: this
    });
    let installed = new Map<string, IWebModule>();
    // 安装模块
    for (let module of this._modules) {
      this.installModule(module, installed);
    }
    await this.dispatchEvent(WebApplicationEventType.moduleInstalled, {
      webApp: this,
      installed: installed
    });
  }

  /**
   *
   * @param module 待检测模块模块
   * @param dependencies 已检测依赖
   */
  private _checkCircle(module: IWebModule, dependencies: Array<string>, stackList: Array<IWebModule>): boolean {
    if (dependencies) {
      for (let dependence of dependencies) {
        let inStack = false;
        for (let stackModule of stackList) {
          if (stackModule.name == dependence) {
            inStack = true;
            break;
          }
        }
        if (inStack) {
          continue;
        }

        let depModule = this.getModule(dependence);
        if (depModule) {
          stackList.push(depModule);
          if (depModule.name == module.name) {
            return true;
          }
          let isCircle = this._checkCircle(module, depModule.dependencies, stackList);
          if (isCircle) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private installModule(module: IWebModule, installed: Map<string, IWebModule>) {
    if (installed.get(module.name)) {
      return;
    }

    // 检测模块是否包含循环引用
    let checkedList = new Array<IWebModule>();
    let isCircle = this._checkCircle(module, module.dependencies, checkedList);
    if (isCircle) {
      let deptStr = module.name;
      for (let dept of checkedList) {
        deptStr += `->${dept.name}`;
      }
      throw new Error(`module [${module.name}] has circle dependency:${deptStr}`);
    }

    // 安装依赖模块
    if (module.dependencies) {
      for (let dependency of module.dependencies) {
        let dependencyModule = this.getModule(dependency);
        if (dependencyModule) {
          this.installModule(dependencyModule, installed);
        }
      }
    }

    module.install(this);

    //安装模块自身
    this._processModuleInstall(module);
    installed.set(module.name, module);
  }
  /**
   * 异步模块加载后执行安装过程
   * @param module
   */
  public async installAsyncModule(module: IWebModule) {
    await this.dispatchEvent(WebApplicationEventType.asyncModuleInstalling, {
      webApp: this, module
    });
    this._moduleEvents = new WebApplicationEventManager<WebApplicationEventType, WebApplicationEventContext>();
    module.install(this);
    let moduleRegistedEvents = this._moduleEvents;
    this._moduleEvents = null;
    this._processModuleInstall(module);
    await this.dispathEvents(moduleRegistedEvents);
    await this.dispatchEvent(WebApplicationEventType.asyncModuleInstalled, {
      webApp: this,
      module
    });
  }

  private _processModuleInstall(module: IWebModule) {
    // 注册全局组件
    if (module.components) {
      for (const componentName in module.components) {
        let component: any = module.components[componentName];
        Vue.component(componentName, component);
      }
    }

    // 注册路由
    if (module.routes) {
      if (_.isArray(module.routes)) {
        this.addRoutes(module.routes, '/');
      } else {
        let routesMap: RouteConfigWithParent = module.routes;
        for (const parentKeyOrPath in routesMap) {
          this.addRoutes(routesMap[parentKeyOrPath], parentKeyOrPath);
        }
      }
    }

    // 注册多语言包
    if (module.locale) {
      this.addLocaleMessages(module.locale);
    }

    if (!this._started) {
      // 注册mixins
      if (module.mixins) {
        this._mixins = this._mixins.concat(module.mixins);
      }
    }
    // else {
    //   this.dispathEvents(moduleRegistedEvents);
    // }
  }

  private async dispathEvents(
    eventManager: WebApplicationEventManager<WebApplicationEventType, WebApplicationEventContext>
  ) {
    if (eventManager.events.size <= 0) {
      return;
    }
    let eventCtx: WebApplicationEventContext = {
      webApp: this,
      router: this.router
    };
    await eventManager.dispatch(WebApplicationEventType.moduleInstalled, eventCtx, this);
    await eventManager.dispatch(WebApplicationEventType.configLoading, eventCtx, this);
    await eventManager.dispatch(WebApplicationEventType.configLoaded, eventCtx, this);
    await eventManager.dispatch(WebApplicationEventType.routerLoading, eventCtx, this);
    await eventManager.dispatch(WebApplicationEventType.routerLoaded, eventCtx, this);
    await eventManager.dispatch(WebApplicationEventType.applicationStarted, eventCtx, this);

    let session = Session.getSessionDetail();
    if (!session.anonymous) {
      Object.assign(eventCtx, Session.getSessionDetail());
      await eventManager.dispatch(WebApplicationEventType.userSignIn, eventCtx, this);
    }
  }

  public addRouteSecurityPolicy(rSPolicy: RSPolicy) {
    this._routeSecurityPolicy.add(rSPolicy);
  }
  public async hasRouteSecurityPerm(to: Route, from?: Route) {
    return this._routeSecurityPolicy.hasPerm(to, from);
  }
}

let app = new WebApplicationCls();

export const context: ApplicationContext = app;
export const webApplication: WebApplicationCls = app;
