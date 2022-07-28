import _ from 'lodash';
import { Hierarchical, HierarchicalVisitHandler } from './types';
import { Route } from 'vue-router';
import Vue from 'vue';
import { ConfigHelper } from '../config';
import urlTemplate from './url_template';
import pathToRegexp from 'path-to-regexp';

/**
 * path-to-regexp转换过程中的一些特殊字符
 */
const skipChars = [
  { s: 'http:', t: '__-__' },
  { s: 'https:', t: '__--__' },
  { s: '(', sr: '\\(', t: '__---__', tr: null }
];

function escapeSkipChar(url: string): string {
  for (const item of skipChars) {
    url = url.replace(new RegExp(item.sr || item.s, 'ig'), item.t);
  }
  return url;
}

function decodeSkipChar(url: string): string {
  for (const item of skipChars) {
    url = url.replace(new RegExp(item.tr || item.t, 'ig'), item.s);
  }
  return url;
}

export const Utils = {
  /**
   * 将url中的参数替换为参数值，如 /res/:id --> /res/xxxx
   * @param url 包含可替换参数的url，如 /res/:id
   * @param paramName 需在替换的参数名
   * @param paramVal 参数值
   */
  urlPattern: function(url: string, paramName: string, paramVal: string): string {
    if (!paramName) {
      return url + '';
    }
    if (paramVal == null || typeof paramVal == 'undefined') {
      paramVal = '';
    }
    url = url.replace(':' + paramName, paramVal);
    return url;
  },
  /**
   * 向url添加query参数
   * @param url url
   * @param paramName 参数名
   * @param paramVal 参数值
   */
  appendParam: function(url: string, paramName: string, paramVal: string): string {
    if (!paramName) {
      return url + '';
    }
    if (paramVal == null || typeof paramVal == 'undefined') {
      paramVal = '';
    }
    let _url = url.includes('?') ? url + '&' : url + '?';
    _url += paramName + '=' + encodeURIComponent(paramVal);
    return _url;
  },
  /**
   * 获取当前程序运行的context
   */
  getWebContext: function() {
    if (ConfigHelper.isHistoryRouter()) {
      return ConfigHelper.getRouterBase();
    }

    let webContext = window.location.pathname;
    if (webContext.indexOf('/') > 1) {
      webContext = webContext.substring(0, webContext.lastIndexOf('/'));
    }
    return webContext;
  },
  /**
   * 获取应用的根地址，不以/结束
   */
  getWebRoot: function() {
    let root = window.location.href.substr(0, window.location.href.indexOf('/', 8));
    root += this.getWebContext();
    _.trimEnd(root, '/');
    return root;
  },
  smartAction: function(lockObj: any, _changedQueueKey: string, callback: () => void, _duration = 500) {
    let changedQueueKey = _changedQueueKey;
    let duration = _duration || 500;
    lockObj[changedQueueKey] = lockObj[changedQueueKey] || [];
    //如果数据变化，先往变化队列推一条数据
    lockObj[changedQueueKey].push(true);
    //记录当前变化队列的长度
    let length = lockObj[changedQueueKey].length;
    setTimeout(function() {
      //再次计算变化队列的长度，如果和之前的长度一致则表示等待时间到了，可以做相关操作了；
      //如果不一致说明数据还在变化，等到数据不再持续变化了再继续执行操作
      let _length = lockObj[changedQueueKey].length;
      if (_length === length) {
        lockObj[changedQueueKey] = [];
        callback && callback();
      }
    }, duration);
  },
  smartSearch: function(lockObj: any, _changedQueueKey: string, callback: () => void, _duration = 500) {
    this.smartAction(lockObj, _changedQueueKey, callback, _duration);
  },
  /**
   * 生成一个随机字符串
   * @param len 长度
   */
  randomString: function(len: number) {
    len = len || 32;
    let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    let maxPos = $chars.length;
    let pwd = '';
    for (let i = 0; i < len; i++) {
      pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
  },
  /**
   * 遍历带children的对象
   * @param hierarchicalObj 待遍历对象
   * @param process 处理器
   * @param parent 父结点
   * @param indexOrKey 当前结点在父对象的children中的index值
   */
  visitTree(
    hierarchicalObj: Hierarchical | Hierarchical[],
    process: HierarchicalVisitHandler,
    parent?: Hierarchical,
    indexOrKey?: string | number
  ): boolean | void {
    if (_.isArray(hierarchicalObj)) {
      for (let index = 0; index < hierarchicalObj.length; index++) {
        const item = hierarchicalObj[index];
        let result = this.visitTree(item, process, parent, index);
        if (result === false) {
          return false;
        }
      }
    } else {
      if (hierarchicalObj) {
        let result = process(hierarchicalObj, parent, indexOrKey);
        if (result === false) {
          return result;
        }
        if (hierarchicalObj.children) {
          for (let index = 0; index < hierarchicalObj.children.length; index++) {
            const item = hierarchicalObj.children[index];
            result = this.visitTree(item, process, hierarchicalObj, index);
            if (result === false) {
              return false;
            }
          }
        }
      }
    }
  },
  /**
   * 合并两个路径
   * @param base 基本路径
   * @param relative 相对路径
   */
  mergePath(base: string, relative: string): string {
    if (_.isEmpty(relative)) {
      return base;
    }
    if (relative.indexOf('./') === 0) {
      relative = relative.substr(2);
    }
    if (base[base.length - 1] != '/') base += '/';

    let url = base.substr(0, base.indexOf('/', base.indexOf('//') + 2));
    //baseServerRelative: /relative/subfolder/
    let baseServerRelative = base.substr(base.indexOf('/', base.indexOf('//') + 2));
    if (relative.indexOf('/') === 0)
      //relative is server relative
      url += relative;
    else if (relative.includes('://'))
      //relative is a full url, ignore base.
      url = relative;
    else {
      while (relative.indexOf('../') === 0) {
        //remove ../ from relative
        relative = relative.substring(3);
        //remove one part from baseServerRelative. /relative/subfolder/ -> /relative/
        if (baseServerRelative !== '/') {
          let lastPartIndex = baseServerRelative.lastIndexOf('/', baseServerRelative.length - 2);
          baseServerRelative = baseServerRelative.substring(0, lastPartIndex + 1);
        }
      }
      url += baseServerRelative + relative; //relative is a relative to base.
    }

    return url;
  },
  /**
   * 计算vue实例对应router-view的嵌套层级,该层级与路由matched对应
   * @param instance vue对象实例
   */
  calDepthInRoute(instance: Vue): number {
    let depth = 0;
    let parent = instance;
    while (parent && parent.$root !== parent) {
      const vnodeData = parent.$vnode ? parent.$vnode.data : {};
      if (vnodeData['routerView']) {
        depth = vnodeData['routerViewDepth'];
        break;
      }
      parent = parent.$parent;
    }
    return depth;
  },
  /**
   * 判断vue实例对象，是不是当前路由内的组件
   * @param instance 判vue实例
   * @param to
   */
  matchedRoute(instance: Vue, to: Route): boolean {
    let depth = this.calDepthInRoute(instance);
    if (depth == to.matched.length - 1) {
      return true;
    }
    return false;
  },

  /**
   * 判断一个url是否为绝对地址，以http开头
   * @param url
   */
  isAbsoluteUrl(url: string) {
    return url && url.includes('://');
  },
  /**
   * 解析Url中的变量，并使用params的参数进行替换
   * url格式如：http://xx.domain.com/api/user/:id，
   * 或http://xx.domain.com/api/user/{id}
   * @param url 需要解析的Url
   * @param params 参数列表
   * @param parsedParams 输出Url中包含的变量名
   */
  parseUrl(url: string, params: any, parsedParams?: string[]) {
    let prefix = '';
    if (this.isAbsoluteUrl(url)) {
      let splitIndex = url.indexOf('/', 8) > -1 ? url.indexOf('/', 8) : url.length;
      prefix = url.substr(0, splitIndex);
      if (splitIndex == url.length) {
        url = '';
      } else {
        url = url.substr(splitIndex);
      }
    }

    if (url.includes('{')) {
      url = url.replace(/\$\{/gi, '{');
      let parsedUrl = urlTemplate.parse(url);
      url = parsedUrl.expand(params);
      if (parsedParams) {
        _.forIn(parsedUrl.vars, (item) => {
          parsedParams.push(item);
        });
      }
    } else if (url.indexOf(':') >= 0) {
      let escapeSkipUrl = escapeSkipChar(url);
      let tokens = pathToRegexp.parse(escapeSkipUrl);
      let compileFunc = pathToRegexp.compile(escapeSkipUrl);
      url = decodeSkipChar(compileFunc(params));
      if (parsedParams) {
        _.forEach(tokens, (token: any) => {
          if (token.name) {
            parsedParams.push(token.name);
          }
        });
      }
    }
    url = prefix + url;
    return url;
  },
  /**
   * 根据当前应用模式不同（Hash模式或History），生成不同的静态资源的路径
   * @param relativePath 相对路径
   */
  assetPath(relativePath: string) {
    let base = ConfigHelper.isHistoryRouter() ? ConfigHelper.getRouterBase() : './';
    return Utils.mergePath(base, relativePath);
  }
};
