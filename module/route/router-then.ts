/* eslint-disable @typescript-eslint/ban-types */
import VueRouter, { RawLocation } from 'vue-router';
import Vue from 'vue';
import { ErrorHandler, Location } from 'vue-router/types/router';
import { webApplication, WebApplicationEventType } from '../application';
import _ from 'lodash';
import { Utils } from '../common/utils';

export interface IPagePromise<T> extends Promise<T> {
  onChange(handler: PageChangeHandler): PagePromise;
}

export interface PageChangeHandler {
  (value: any, vm: Vue): void;
}

export class PagePromise implements IPagePromise<Vue> {
  private _promise: Promise<Vue>;
  private _onChangeHandler: PageChangeHandler | unknown;
  constructor(promise?: Promise<Vue>) {
    if (promise) {
      this._promise = promise;
    }
  }
  set promise(p) {
    this._promise = p;
  }
  [Symbol.toStringTag]: string;

  /**
   * 前往新页面，并注册关联新页面的input事件到本页
   * 或为本页某对象自定义指令绑定点击事件
   * 即，新页面里触发input事件，即会回调本自定义指令对应的元素或vue对象的input事件，
   * 即，模拟了v-model事件
   * @param handler 选择页面通过$emit("input")抛出事件的订阅接收程序，支持几种方式：
   * function: (value)=>{....}
   * object.$emit，支持$emit操作的对象，一般为vue实例
   * object.tagName，还tagName标签的元素，一般为input元素，通过input事件设置元素值
   */
  onChange(handler: PageChangeHandler | any): PagePromise {
    this._onChangeHandler = handler;
    return this;
  }

  emitChange(value: any, vm: Vue) {
    console.log('page.input', value);
    let el: any = this._onChangeHandler;
    if (typeof el == 'function') {
      el(value, vm);
    } else if (typeof el == 'object') {
      if (el.$emit) {
        el.$emit('input', value);
      } else if (el.tagName) {
        el.value = value;
        const e = document.createEvent('HTMLEvents');
        // e.initEvent(binding.modifiers.lazy?'change':'input', true, true);
        e.initEvent('input', true, true);
        el.dispatchEvent(e);
      }
    }
  }

  then<TResult1 = Vue, TResult2 = never>(
    onfulfilled?: (value: Vue) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<Vue | TResult> {
    return this._promise.catch(onrejected);
  }

  finally(onfinally?: () => void): Promise<Vue> {
    return this._promise.finally(onfinally);
  }
}

export class RouterThen {
  resolve: (value?: Vue | PromiseLike<Vue>) => void;

  get $router(): VueRouter {
    return webApplication.router;
  }

  //跳到指定页面，并返回promise
  request(
    requestType,
    location: RawLocation | number,
    onComplete: Function = null,
    onAbort: ErrorHandler = null
  ): PagePromise {
    if (!requestType) {
      requestType = 'push';
    }
    if (!location || location == '') {
      throw new Error('location is missing');
    }
    let pagePromise = new PagePromise();

    let promise = new Promise<Vue>((resolve, reject) => {
      if (this.$router) {
        this.resolve = resolve;
        let locObj = this.enableKeepAlive(<RawLocation>location);
        switch (requestType) {
          case 'push':
            this.$router.push(locObj, onComplete, onAbort);
            break;
          case 'replace':
            this.$router.replace(locObj, onComplete, onAbort);
            break;
          case 'go':
            this.$router.go(<number>location);
            break;
          default:
            reject('requestType error:' + requestType);
            break;
        }
      } else {
        reject('$router missing');
      }
    })
      .then((vm) => {
        vm.$on('input', (value) => {
          pagePromise.emitChange(value, vm);
        });
        return vm;
      })
      .catch((error) => {
        this.resolve = null;
        throw new Error(error);
      });

    pagePromise.promise = promise;
    return pagePromise;
  }

  private enableKeepAlive(location: RawLocation): Location {
    let locObj: Location;
    if (_.isString(location)) {
      locObj = { path: location };
    } else if (typeof location == 'object') {
      locObj = location;
    } else {
      return null;
    }
    if (locObj.query) {
      Object.assign(locObj.query, { _cache_opener: 'true' });
    } else {
      Object.assign(locObj, { query: { _cache_opener: 'true' } });
    }
    return locObj;
  }
  //前往指定页面
  push(location: RawLocation, onComplete: Function = null, onAbort: ErrorHandler = null): PagePromise {
    return this.request('push', location, onComplete, onAbort);
  }
  //替换当前页
  replace(location: RawLocation, onComplete: Function = null, onAbort: ErrorHandler = null): PagePromise {
    return this.request('replace', location, onComplete, onAbort);
  }
  //历史记录跳转
  go(step = 0): PagePromise {
    return this.request('go', step);
  }
  static clickElFun(_event) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let self: any = this;
    let link = self.getAttribute('model-link');
    if (link) {
      return routerThen
        .push(link)
        .onChange(self.vnode && self.vnode.componentInstance ? self.vnode.componentInstance : self);
    }
    return Promise.resolve();
  }
}

export const routerThen = new RouterThen();
const key_for_router_then = 'routerThen';

function getRouterVm(instance) {
  let matched = null;
  let parent = instance;
  while (parent && parent.$root !== parent) {
    const vnodeData = parent.$vnode ? parent.$vnode.data : {};
    if (vnodeData[key_for_router_then]) {
      matched = parent;
      break;
    }
    parent = parent.$parent;
  }
  return matched;
}

/** 初始化及安装RouteThen */
webApplication.registerEvent(WebApplicationEventType.routerLoading, () => {
  let Vue = webApplication.Vue;
  // 注册一个实例方法
  if (!Vue.prototype.$routerThen) {
    Object.defineProperty(Vue.prototype, '$routerThen', {
      get: function() {
        return routerThen;
      },
      enumerable: true
    });
    Vue.prototype.$routerReturn = function(result) {
      let routerVm = getRouterVm(this);
      if (routerVm) {
        routerVm.$emit('input', result);
      }
    };
  }
  // 注册一个指令
  Vue.directive('model-link', function(el, binding, vnode) {
    el['binding'] = binding;
    el['vnode'] = vnode;
    el.setAttribute('model-link', binding.value);
    el.removeEventListener('click', RouterThen.clickElFun);
    el.addEventListener('click', RouterThen.clickElFun);
  });

  // mixin全局路由，
  Vue.mixin({
    // 在路由跳转到下一个页面之前，为下一个页面注册回调事件。
    beforeRouteEnter: function(to, from, next) {
      if (routerThen.resolve) {
        next((vm) => {
          if (Utils.matchedRoute(vm, to)) {
            vm.$vnode.data[key_for_router_then] = true;
            routerThen.resolve(vm);
            routerThen.resolve = null;
          }
        });
      } else {
        next();
      }
    },
    beforeRouteUpdate: function(to, from, next) {
      if (routerThen.resolve && Utils.matchedRoute(this, to)) {
        this.$vnode.data[key_for_router_then] = true;
        routerThen.resolve(this);
        routerThen.resolve = null;
      }
      next();
    }
  });
});
