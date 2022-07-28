import _ from 'lodash';
import VueRouter, { RouteConfig } from 'vue-router';
import { Utils, Hierarchical } from '../common';

/**
 * 路由管理
 */
export class RouteManager {
  private _routes: Array<RouteConfig> = [];
  // 需要被合并重载的路由
  private _override: Array<RouteConfig> = [];
  // 当前Vue的router对象
  private _router: VueRouter;

  get routes() {
    return this._routes;
  }

  public setRouter(router: VueRouter) {
    this._router = router;
  }

  /**
   * 以合并的方式添加路由
   * @param routes 待添加的路由
   * @param parent 所属的父路由
   */
  public addRoutes(routes: RouteConfig[], parent?: string | RouteConfig) {
    let parentRoute;
    if (parent) {
      if (_.isString(parent)) {
        parentRoute = this.findRoute(parent);
        if (parentRoute) {
          if (!parentRoute.children) {
            parentRoute.children = [];
          }
          if (!parentRoute.meta) {
            parentRoute.meta = {};
          }
          parentRoute.meta.$children = true;
        }
      } else {
        parentRoute = parent;
      }
    }

    //合并添加路由
    Utils.visitTree(routes, (item, itemParent) => {
      // 过滤需要重载的路由
      if (item.meta && item.meta.override) {
        this._override.push(<RouteConfig>item);
        return;
      }

      if (!itemParent) {
        itemParent = parentRoute;
      }
      this.prepareRoute(item, item.parent || itemParent);
      let parentChildren = item.parent ? item.parent.children : this._routes;
      let existRoute;
      for (const route of parentChildren) {
        if (route === item) {
          return;
        }
        if (route.path === item.path) {
          existRoute = route;
        }
      }
      if (!existRoute) {
        parentChildren.push(<RouteConfig>item);
        return;
      }
      // 合并路由
      if (item.children) {
        for (const childRoute of item.children) {
          childRoute.parent = existRoute;
        }
      }
      let metaInfo = Object.assign({}, existRoute.meta || {}, item.meta || {});
      Object.assign(existRoute, _.omit(item, 'children'));
      existRoute.meta = metaInfo;
    });
  }

  /**
   * 运行时，动态添加路由
   * @param routes 待添加的路由
   * @param parent 所属的父路由
   */
  public addRoutesForRuntime(routes: RouteConfig[], parent?: string) {
    if (!this._router) {
      throw new Error('路由对象尚未生成，无法动态添加路由');
    }
    let parentRoute = null;
    if (parent) {
      parentRoute = this.findRoute(parent);
    }
    this.addRoutes(routes, parentRoute);

    //动态添加到vue-router对象上
    routes.forEach((route) => {
      if (parentRoute) {
        this._router.addRoute(parentRoute.name, route);
      } else {
        this._router.addRoute(route);
      }
    });
  }

  /**
   * 根据名称或路由合并路由，会递归合并子路由
   * @param pathOrName 要合并的路由名称，或路由全路径
   * @param routeConfig
   */
  public merge(pathOrName: string, routeConfig: RouteConfig) {
    let currentRoute = this.findRoute(pathOrName);
    if (!currentRoute) {
      this._routes.push(routeConfig);
    } else {
      this.addRoutes([routeConfig], (<any>currentRoute).parent);
    }
  }

  /**
   * 根据名称或路径替换路由，被替换的子路由会丢失，使用新的children
   * @param pathOrName 要替换的路由名称，或路由全路径
   * @param routeConfig
   */
  public replace(pathOrName: string, routeConfig: RouteConfig) {
    let currentRoute = <any>this.remove(pathOrName);
    let parentChildren: RouteConfig[] =
      currentRoute && currentRoute.parent ? currentRoute.parent.children : this._routes;
    parentChildren.push(this.prepareRoute(routeConfig, currentRoute.parent));
  }

  /**
   * 根据名称或路径移除路由
   * @param pathOrName 要移除路由的名称，或全路径
   */
  public remove(pathOrName: string): RouteConfig {
    let currentRoute = <any>this.findRoute(pathOrName);
    if (!currentRoute) {
      return null;
    }
    let parentChildren: RouteConfig[] = currentRoute.parent ? currentRoute.parent.children : this._routes;
    parentChildren.forEach(function(item, index, arr) {
      if (item === currentRoute) {
        arr.splice(index, 1);
      }
    });
    return currentRoute;
  }

  /**
   * 应用路由的重载
   */
  public applyOverrideRoutes() {
    this._override.forEach((item) => {
      let override = item.meta.override;
      if (override === true) {
        override = item.name ? item.name : item.path;
      }
      item.meta.override = false;
      this.merge(override, item);
    });
  }

  /**
   * 添加需要重载的路由,各路由需要设置meta.override属性，指定需要重载的路由名或全路径
   * @param routes
   */
  public addOverrideRoutes(routes: RouteConfig[]) {
    this._override.push(...routes);
  }

  /**
   * 对路由做预处理
   * @param route 路由配置信息
   * @param parent
   */
  private prepareRoute(route, parent) {
    let vueRoute: RouteConfig = <RouteConfig>route;
    route.parent = parent;
    route.$fullPath = this.calFullPath(vueRoute);
    if (!vueRoute.name) {
      vueRoute.name = route.$fullPath.replace(/\//gi, '_');
    }

    if (route.children && route.children.length > 0) {
      route.meta = Object.assign(route.meta || {}, { $children: true });
    }

    return route;
  }

  /**
   * 根据Path或Name查找路由
   *
   * @param {string} pathOrName 路由路径或名称，路由的话必须以/开头
   * @memberof RouteManager
   * @returns {RouteConfig} 已查询到的路由
   */
  public findRoute(pathOrName: string): RouteConfig {
    let matched;
    Utils.visitTree(this._routes, (item, parent, _index) => {
      if (!item.parent) {
        item.parent = parent;
      }
      if (!item.$fullPath) {
        item.$fullPath = this.calFullPath(<RouteConfig>item);
      }
      if (pathOrName == item.$fullPath || pathOrName == (<RouteConfig>item).name) {
        matched = item;
        return false;
      }
    });
    return matched;
  }

  private calFullPath(route: RouteConfig): string {
    let current = route;
    let path = '';
    while (current) {
      path = Utils.mergePath(current.path, path);
      if (path.startsWith('/')) {
        break;
      }
      let parent = (<Hierarchical>current).parent;
      if (parent && parent != current) {
        current = <RouteConfig>parent;
      } else {
        current = null;
      }
    }
    return path;
  }
  //应用卸载时，清理掉所有的路由
  destroy() {
    this._routes = [];
  }
}
