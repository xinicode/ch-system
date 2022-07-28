import _ from 'lodash';
import pathToRegexp from 'path-to-regexp';
import qs from 'query-string';
import { Route, RouteRecord } from 'vue-router';
import { VNodeCache, VNodeCachedItem } from './vnode-cache';

function buildCacheKeyFromRoute(matchedRoute: Route | RouteRecord, route: Route): string {
  if (!matchedRoute) {
    return null;
  }
  const params = route.params;
  let op = _.assign({}, params);
  if (Object.prototype.hasOwnProperty.call(matchedRoute, 'params')) {
    op = _.assign(op, (<Route>matchedRoute).params);
  }
  let key;
  //绝对地址不做路径转化，否则会出现误将端口作为变量替换的错误
  if (matchedRoute.path.startsWith('http')) {
    key = matchedRoute.path;
  } else {
    try {
      key = pathToRegexp.compile(matchedRoute.path)(op);
    } catch (error) {
      console.log(error);
      key = matchedRoute.path;
    }
  }
  if (Object.prototype.hasOwnProperty.call(matchedRoute, 'query')) {
    if ((<Route>matchedRoute).query) {
      let filterQuery = {};
      for (const item in (<Route>matchedRoute).query) {
        if (item.startsWith('_')) {
          continue;
        }
        filterQuery[item] = (<Route>matchedRoute).query[item];
      }
      let queryString = qs.stringify(filterQuery);
      if (queryString.length > 0) {
        key += `?${queryString}`;
      }
    }
  }
  let bgKey = `bg_${key}`;
  if (_keyGeneratorList.length > 0) {
    //可以多个keyGenerator
    _.forEach(_keyGeneratorList, function(fn) {
      if (fn) {
        //建议组合bgKey内容为新key
        const newKey = fn(matchedRoute, route, bgKey);
        //如果newKey为空，跳过此key
        if (newKey) bgKey = newKey;
      }
    });
  }
  return bgKey;
}

/**
 * matchedRoute为要计算key的route, route为当前路由
 * 如果为返回空值路过处理
 */
type KeyGeneratorFn = (matchedRoute: Route | RouteRecord, route: Route, key: string) => string;

export interface IVNodeCacheManager {
  cacheList: VNodeCache[];
  register(cache: VNodeCache);
  remove(cache: VNodeCache);
  beforeEachRoute(to: Route, from: Route);
  buildCacheKeyFromRoute(matchedRoute: Route | RouteRecord, route: Route): string;
  clean();
  cleanByRoute(route: Route | RouteRecord, recursive: boolean, params?: any): VNodeCachedItem[];
  /**
   * 添加 key 生成器
   * @param fn
   */
  addKeyGenerator(fn: KeyGeneratorFn): void;
  /**
   * 删除 key 生成器
   * @param fn
   */
  removeKeyGenerator(fn: KeyGeneratorFn): void;
}

export const VNodeCacheManager: IVNodeCacheManager = {
  cacheList: <VNodeCache[]>[],
  register(cache: VNodeCache) {
    this.cacheList.push(cache);
  },
  remove(cache: VNodeCache) {
    for (let i = this.cacheList.length - 1; i >= 0; i--) {
      if (this.cacheList[i] == cache) {
        this.cacheList = this.cacheList.splice(i, 1);
        break;
      }
    }
  },
  clean() {
    for (let i = this.cacheList.length - 1; i >= 0; i--) {
      let cache: VNodeCache = this.cacheList[i];
      cache.clean();
    }
  },
  cleanByRoute(route: Route | RouteRecord, recursive = false, _params?: any): VNodeCachedItem[] {
    let list: VNodeCachedItem[] = [];
    let keys = [];
    keys.push(buildCacheKeyFromRoute(route, route as Route));
    if (recursive) {
      let routeObj = <Route>route;
      if (routeObj.matched) {
        for (let i = 0; i < routeObj.matched.length - 1; i++) {
          keys.push(buildCacheKeyFromRoute(routeObj.matched[i], route as Route));
        }
      }
    }
    for (const cache of this.cacheList) {
      for (const cacheKey of keys) {
        let item = cache.remove(cacheKey);
        if (item) {
          list.push(item);
        }
      }
    }
    return list;
  },
  buildCacheKeyFromRoute(matchedRoute: Route | RouteRecord, route: Route): string {
    return buildCacheKeyFromRoute(matchedRoute, route);
  },
  beforeEachRoute(to: Route, from: Route) {
    let fromRouteCacheKey = buildCacheKeyFromRoute(from, from);
    let toRouteCacheKey = buildCacheKeyFromRoute(to, to);
    let noCacheToRoute: any = to.query && (to.query['_no_cache'] || to.params['_no_cache']);
    for (const cache of this.cacheList) {
      let cachedItem = cache.keepAliveInstance.tryCreateCache(to, from);
      if (!cachedItem && cache.isExist(fromRouteCacheKey)) {
        cache.remove(fromRouteCacheKey);
      }
      if (cache.isExist(toRouteCacheKey) && noCacheToRoute) {
        cache.remove(toRouteCacheKey);
      }
    }
  },
  addKeyGenerator(fn: KeyGeneratorFn) {
    _keyGeneratorList.push(fn);
  },
  removeKeyGenerator(fn: KeyGeneratorFn) {
    _keyGeneratorList = _.filter(_keyGeneratorList, function(item) {
      return item != fn;
    });
  }
};

let _keyGeneratorList: KeyGeneratorFn[] = [];
