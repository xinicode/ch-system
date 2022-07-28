import _ from 'lodash';
import { VNode, VNodeComponentOptions } from 'vue';
import { Route, RouteRecord } from 'vue-router';
import { VNodeCacheManager } from './cache-manager';

/**
 * 缓存过期策略
 */
export interface ExpireStrategy {
  hitCount?: {
    count: number;
  };
  once?: boolean;
}

/**
 * 缓存检查器
 */
interface ICacheChecker {
  (cachedItem: VNodeCachedItem): boolean;
}

/**
 * 缓存检查程序
 */
const cacheCheckerList: ICacheChecker[] = [
  (cachedItem) => {
    if (cachedItem.expireWhen && cachedItem.expireWhen.once) {
      return cachedItem.hitCount >= 1;
    }
    return false;
  },
  (cachedItem) => {
    if (cachedItem.expireWhen && cachedItem.expireWhen.hitCount) {
      return cachedItem.hitCount >= cachedItem.expireWhen.hitCount.count;
    }
    return false;
  }
];

/**
 * 被缓存的元素
 */
export class VNodeCachedItem {
  /** 缓存的key */
  key: string;
  /** 组件名称，只读 */
  name: string;
  /** 缓存的元素 */
  vnode: VNode;
  /** 标签 */
  tags: string[] = [];
  /** 被缓存对象所属的路由信息 */
  matchedRoute: RouteRecord;
  /** 缓存过期策略 */
  expireWhen: ExpireStrategy;
  /** 最后访问时间 */
  lastVisitAt = new Date();
  /** 访问次数 */
  hitCount = 0;
}

export interface ICacheableComponent {
  tryCreateCache(to: Route, from: Route): VNodeCachedItem;
}
/**
 * 虚拟Dom缓存管理器
 */
export class VNodeCache {
  /** 缓存关联的keepAlive实例 */
  keepAliveInstance: ICacheableComponent & Vue;
  /** keepAlive组件匹配route的位置 */
  depthInRoute: number;
  /** 已经缓存的组件 */
  cached = new Map<string, VNodeCachedItem>();
  /** 最大缓存数 */
  max: number;
  /** 已缓存组件key */
  keys: string[] = [];

  constructor(instance: ICacheableComponent & Vue) {
    this.keepAliveInstance = instance;
    this.depthInRoute = this.calDepthInRoute(instance);
    VNodeCacheManager.register(this);
  }

  public add(vnode: VNode, key?: string, expireWhen?: ExpireStrategy, tags?: string[]): VNodeCachedItem {
    let item = new VNodeCachedItem();
    if (!key) {
      key = this.buildCacheKey(vnode);
    }
    let cachedItem = this.cached.get(key);
    if (cachedItem) {
      _.remove(this.keys, (item) => item == key);
      this.keys.push(key);
      return cachedItem;
    }
    Object.assign(item, {
      key,
      name: this.getComponentName(vnode.componentOptions),
      vnode,
      expireWhen,
      tags
    });

    this.cached.set(key, item);
    this.keys.push(key);
    vnode.data.keepAlive = true;

    return item;
  }

  /**
   * 根据key获取缓存
   * @param key 缓存key
   */
  public get(key: string): VNodeCachedItem {
    let cachedItem = this.cached.get(key);
    if (cachedItem) {
      cachedItem.hitCount++;
      if (cachedItem.expireWhen && this.isExpired(cachedItem)) {
        this.keepAliveInstance.$nextTick(() => {
          this.remove(cachedItem.key);
        });
      }
    }
    return cachedItem;
  }

  /**
   * 判断已缓存数据，是否满足过期条件
   * @param cachedItem 已缓存的记录
   */
  public isExpired(cachedItem: VNodeCachedItem) {
    let expired = false;
    for (const cheker of cacheCheckerList) {
      expired = cheker(cachedItem);
      if (expired) {
        break;
      }
    }
    return expired;
  }

  public isExist(key: string): boolean {
    let cachedItem = this.cached.get(key);
    if (cachedItem) {
      return true;
    }
    return false;
  }

  /**
   * 设置key对应的路由缓存，过期策略为once
   * @param key 路由缓存key
   */
  public once(key: string) {
    let cachedItem = this.cached.get(key);
    if (cachedItem) {
      if (cachedItem.expireWhen) {
        Object.assign(cachedItem.expireWhen, { once: true });
      } else {
        Object.assign(cachedItem, { expireWhen: { once: true } });
      }
    }
  }

  /**
   * 移除缓存
   * @param key 缓存key
   */
  public remove(key: string, destroy = true): VNodeCachedItem {
    let cachedItem = this.cached.get(key);
    if (cachedItem) {
      this.cached.delete(cachedItem.key);
      _.remove(this.keys, (item) => item == key);
      cachedItem.vnode.data.keepAlive = false;
      if (destroy) {
        cachedItem.vnode.componentInstance.$destroy();
      }
    }
    return cachedItem;
  }

  /** 清除所有缓存 */
  public clean() {
    this.cached.forEach((item, key) => {
      this.remove(key);
    });
  }

  public destroy() {
    this.clean();
    VNodeCacheManager.remove(this);
  }

  /**
   * 为待缓存组件实例生成缓存的key，生成规则：计算keep-alive组件所匹配的路由
   * @param vnode 待缓存组件实体
   */
  public buildCacheKey(vnode: VNode) {
    const $route = vnode.context.$route;
    const matchedRoute = this.depthInRoute == $route.matched.length - 1 ? $route : $route.matched[this.depthInRoute];
    let key = VNodeCacheManager.buildCacheKeyFromRoute(matchedRoute, $route);
    return key;
  }

  public canCache(to: Route, from: Route) {
    if (from.meta && from.meta.cache) {
      return true;
    }

    if ((to.meta && to.meta.cacheOpener) || to.query['_cache_opener'] || to.params['_cache_opener']) {
      return true;
    }

    if (from.meta && from.meta.cacheForChild && to.fullPath.length > from.fullPath.length) {
      const fromPath = from.fullPath.split('?')[0];
      const toPath = to.fullPath.split('?')[0];
      return toPath.indexOf(fromPath) === 0;
    }
    return false;
  }

  public calDepthInRoute(instance: Vue): number {
    let depth = 0;
    let parent = instance.$parent;
    while (parent && parent.$root !== parent) {
      const vnodeData = parent.$vnode ? parent.$vnode.data : {};
      if (vnodeData['routerView']) {
        depth = vnodeData['routerViewDepth'] + 1;
        break;
      }
      parent = parent.$parent;
    }
    return depth;
  }

  public getComponentName(opts: VNodeComponentOptions): string {
    return opts && (opts.Ctor['options'].name || opts.tag);
  }
}
