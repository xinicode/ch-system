import { MenuService } from "@fly-vue/iview-admin";
import { CmpLogger } from '@ch/core';
import Vue from 'vue';
/**
 * 通用混合
 * */
export default {
    methods: {
        // 当 $route 更新时触发
        appRouteChange(to, from) {

        }
    },
    watch: {
        // 监听路由 控制侧边栏显示 标记当前顶栏菜单
        '$route'(to, from) {
            Vue.nextTick(() => {
                let headrName = MenuService.getHeaderName();
                if (!headrName) {
                    const headerMenus = MenuService.headerMenus();
                    if (headerMenus && headerMenus.length > 0)
                        headrName = headerMenus[0].name;
                    if (headrName) MenuService.setHeaderName(headrName);
                }
                // CmpLogger.debug('menuservice', MenuService.getHeaderName(), MenuService);

            });
        }
    }
}
