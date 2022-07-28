import { webApplication } from '../application/application';
import BgKeepAlive from './bg-keep-alive';
import { WebApplicationEventType } from '../application/event';
import { VNodeCacheManager, IVNodeCacheManager } from './cache-manager';

webApplication.addModule({
  name: '@fly-vue/core:keep-alive',
  version: process.env.VUE_APP_VERSION,
  dependencies: [],
  components: {
    'bg-keep-alive': BgKeepAlive
  },
  install() {
    webApplication.registerEvent(WebApplicationEventType.routerLoaded, () => {
      webApplication.router.beforeEach((to, from, next) => {
        VNodeCacheManager.beforeEachRoute(to, from);
        next();
      });
    });
  }
});

export const KeepAliveManager: IVNodeCacheManager = VNodeCacheManager;
