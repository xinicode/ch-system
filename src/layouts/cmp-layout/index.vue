<template>
  <Layout class="i-layout">
    <Sider
      v-if="!isMobile && !hideSider"
      class="i-layout-sider"
      :class="siderClasses"
      :width="menuSideWidth"
    >
      <!-- 左边菜单 -->
      <i-menu-side
        :hide-logo="isHeaderStick && headerFix && showHeader"
        :logo="logo"
        :on-click="onMenuClick"
      />
    </Sider>
    <Layout class="i-layout-inside" :class="insideClasses">
      <transition name="fade-quick">
        <Header
          class="i-layout-header"
          :class="headerClasses"
          :style="headerStyle"
          v-show="showHeader"
          v-resize="handleHeaderWidthChange"
        >
          <i-header-logo v-if="isMobile && showMobileLogo" :logo="logo" />
          <i-header-logo v-if="!isMobile && isHeaderStick && headerFix" :logo="logo" />
          <i-header-collapse
            v-if="(isMobile || showSiderCollapse) && !hideSider"
            @on-toggle-drawer="handleToggleDrawer"
          />
          <!-- <i-menu-head v-if="headerMenu && !isMobile" ref="menuHead" /> -->
          <i-header-menu v-if="headerMenu && !isMobile" ref="menuHead" />

          <i-header-search v-if="showSearch && !headerMenu && !isMobile && !showBreadcrumb" />
          <div class="i-layout-header-right">
            <i-header-search
              v-if="(showSearch && isMobile) || (showSearch && (headerMenu || showBreadcrumb))"
            />
            <!-- <i-menu-head v-if="headerMenu && isMobile" /> -->
            <i-header-menu v-if="headerMenu && isMobile" />
            <i-header-log v-if="isDesktop && showLog" />
            <i-header-fullscreen v-if="isDesktop && showFullscreen" />
            <i-header-notice v-if="showNotice" />
            <i-header-menu-right />
            <!-- <i-header-user /> -->
            <i-header-i18n v-if="showI18n" />
            <!-- <i-header-setting v-if="enableSetting && !isMobile" /> -->
          </div>
        </Header>
      </transition>
      <Content class="i-layout-content" :class="contentClasses">
        <transition name="fade-quick">
          <i-tabs v-if="tabs" :menu-side="menuSider" v-show="showHeader" @on-reload="handleReload" />
        </transition>
        <div class="i-layout-content-main" ref="contentMain">
          <!-- <keep-alive :include="keepAlive">
                        <router-view v-if="loadRouter" />
          </keep-alive>-->
          <!-- <bg-keep-alive :include="keepAlive">
            <router-view v-if="loadRouter" />
          </bg-keep-alive>-->

          <cmp-content :include="keepAlive" :loadRouter="loadRouter" />
        </div>
      </Content>
      <!-- <i-copyright v-if="showCopyRight" /> -->
    </Layout>
    <div v-if="isMobile && !hideSider">
      <Drawer v-model="showDrawer" placement="left" :closable="false" :class-name="drawerClasses">
        <i-menu-side />
      </Drawer>
    </div>
  </Layout>
</template>
<style lang="less">
.cmp-layout-body-iframe {
  overflow: hidden;
}
.cmp-layout-content-main-iframe {
  overflow: hidden;
  > div {
    height: 100%;
  }
}
</style>
<script>
import { mapState, mapGetters, mapMutations } from "vuex";
import Setting from "@/setting";
import menuSider from "@/menu/sider";
import iHeaderNotice from "./header-notice";
import iHeaderSearh from "./header-search";
import iHeaderUser from "./header-user";
// import iHeaderLogo from "./header-logo/index.vue";
import iHeaderMenu from "./header-menu/index.vue";
import iHeaderMenuRight from "./header-menu-right";

import { requestAnimation, MenuService } from "@fly-vue/iview-admin";
import { CmpCoreMixin, CmpVue, CmpCore } from "@ch/core";
import { CmpSystem } from "@ch/system";
import webApplication from "@fly-vue/core";
import clickItem from "@/mixins/click-item";

function _getOffsetRect(element) {
  const body = document.body;

  const doc = element.ownerDocument;
  const docElem = doc.documentElement;
  const win = doc.defaultView;
  const offsetTop = win.pageYOffset - docElem.clientTop;
  const offsetLeft = win.pageXOffset - docElem.clientLeft;

  const bodyRect = body.getBoundingClientRect();
  const bodyTop = bodyRect.top + offsetTop - body.scrollTop;
  const bodyLeft = bodyRect.left + offsetLeft - body.scrollLeft;

  const rect = element.getBoundingClientRect();
  const top = rect.top + offsetTop - bodyTop;
  const bottom = rect.bottom + offsetTop - bodyTop;
  const left = rect.left + offsetLeft - bodyLeft;
  const right = rect.right + offsetLeft - bodyLeft;
  const width = right - left;
  const height = bottom - top;

  return {
    top,
    bottom,
    left,
    right,
    width,
    height
  };
}

/** 是否已经初始化 */
let _isInitRouter = false;

export default {
  name: "CmpLayout",
  mixins: [CmpCoreMixin, clickItem],
  components: {
    // iHeaderLogo,
    iHeaderMenu,
    iHeaderNotice,
    iHeaderSearh,
    iHeaderUser,
    iHeaderMenuRight
  },
  data() {
    return {
      menuSider,
      showDrawer: false,
      ticking: false,
      headerVisible: true,
      oldScrollTop: 0,
      isDelayHideSider: false, // hack，当从隐藏侧边栏的 header 切换到正常 header 时，防止 Logo 抖动
      loadRouter: true,
      logo: {
        small: "./static/images/logo-small.png",
        normal: "./static/images/logo.png",
        dark: "./static/images/logo-dark.png"
      }
    };
  },
  computed: {
    ...mapState("admin/layout", [
      "siderTheme",
      "headerTheme",
      "headerStick",
      "tabs",
      "tabsFix",
      "siderFix",
      "headerFix",
      "headerHide",
      "headerMenu",
      "isMobile",
      "isTablet",
      "isDesktop",
      "menuCollapse",
      "showMobileLogo",
      "showSearch",
      "showNotice",
      "showFullscreen",
      "showSiderCollapse",
      "showBreadcrumb",
      "showLog",
      "showI18n",
      "showReload",
      "enableSetting",
      "showCopyRight"
    ]),
    ...mapState("admin/page", ["keepAlive"]),
    ...mapGetters("admin/menu", ["hideSider", "filterSider", "currentHeader"]),
    // 如果开启 headerMenu，且当前 header 的 hideSider 为 true，则将顶部按 headerStick 处理
    // 这时，即使没有开启 headerStick，仍然按开启处理
    isHeaderStick() {
      let state = this.headerStick;
      if (this.hideSider) state = true;
      return state;
    },
    showHeader() {
      let visible = true;
      if (this.headerHide) visible = false;
      return visible;
    },
    headerClasses() {
      return [
        `i-layout-header-color-${this.headerTheme}`,
        {
          "i-layout-header-fix": this.headerFix,
          "i-layout-header-fix-collapse": this.headerFix && this.menuCollapse,
          "i-layout-header-mobile": this.isMobile,
          "i-layout-header-stick": this.isHeaderStick && !this.isMobile,
          "i-layout-header-with-menu": this.headerMenu,
          "i-layout-header-with-hide-sider":
            this.hideSider || this.isDelayHideSider
        }
      ];
    },
    headerStyle() {
      const menuWidth = this.isHeaderStick
        ? 0
        : this.menuCollapse
        ? 80
        : Setting.menuSideWidth;
      return this.isMobile || !this.headerFix
        ? {}
        : {
            width: `calc(100% - ${menuWidth}px)`
          };
    },
    siderClasses() {
      return {
        "i-layout-sider-fix": this.siderFix,
        "i-layout-sider-dark": this.siderTheme === "dark"
      };
    },
    contentClasses() {
      return {
        "i-layout-content-fix-with-header": this.headerFix,
        "i-layout-content-with-tabs": this.tabs,
        "i-layout-content-with-tabs-fix": this.tabs && this.tabsFix
      };
    },
    insideClasses() {
      return {
        "i-layout-inside-fix-with-sider": this.siderFix,
        "i-layout-inside-fix-with-sider-collapse":
          this.siderFix && this.menuCollapse,
        "i-layout-inside-with-hide-sider": this.hideSider,
        "i-layout-inside-mobile": this.isMobile
      };
    },
    drawerClasses() {
      let className = "i-layout-drawer";
      if (this.siderTheme === "dark") className += " i-layout-drawer-dark";
      return className;
    },
    menuSideWidth() {
      return this.menuCollapse ? 80 : Setting.menuSideWidth;
    },
    isFrame() {
      return this.$route.path == "/iframe/index";
    }
  },
  watch: {
    hideSider() {
      this.isDelayHideSider = true;
      setTimeout(() => {
        this.isDelayHideSider = false;
      }, 0);
    },
    $route(to, from) {
      this.checkFrame();
      if (to.name === from.name) {
        // 相同路由，不同参数，跳转时，重载页面
        if (Setting.sameRouteForceUpdate) {
          this.handleReload();
        }
      }
    }
  },
  methods: {
    ...mapMutations("admin/layout", ["updateMenuCollapse"]),
    ...mapMutations("admin/page", ["keepAlivePush", "keepAliveRemove"]),
    handleToggleDrawer(state) {
      if (typeof state === "boolean") {
        this.showDrawer = state;
      } else {
        this.showDrawer = !this.showDrawer;
      }
    },
    calcHeight() {
      if (!this.isFrame) {
        return;
      }
      const contentMain = this.$refs.contentMain;
      if (!contentMain) return;
      const offset = _getOffsetRect(contentMain);
      const winHeight = window.innerHeight;
      const minHeight = winHeight - offset.top;
      contentMain.style.setProperty("height", minHeight + "px");
    },
    handleResize() {
      requestAnimation(() => this.calcHeight());
    },
    checkFrame() {
      const contentMain = this.$refs.contentMain;
      if (!contentMain) return;
      if (this.isFrame) {
        contentMain.classList.add("cmp-layout-content-main-iframe");
        document.body.classList.add("cmp-layout-body-iframe");
        this.handleResize();
      } else {
        contentMain.style.removeProperty("height");
        contentMain.classList.remove("cmp-layout-content-main-iframe");
        document.body.classList.remove("cmp-layout-body-iframe");
      }
    },
    handleScroll() {
      if (!this.headerHide) return;

      const scrollTop =
        document.body.scrollTop + document.documentElement.scrollTop;

      if (!this.ticking) {
        this.ticking = true;
        requestAnimation(() => {
          if (this.oldScrollTop > scrollTop) {
            this.headerVisible = true;
          } else if (scrollTop > 300 && this.headerVisible) {
            this.headerVisible = false;
          } else if (scrollTop < 300 && !this.headerVisible) {
            this.headerVisible = true;
          }
          this.oldScrollTop = scrollTop;
          this.ticking = false;
        });
      }
    },
    handleHeaderWidthChange() {
      const $breadcrumb = this.$refs.breadcrumb;
      if ($breadcrumb) {
        $breadcrumb.handleGetWidth();
        $breadcrumb.handleCheckWidth();
      }
      const $menuHead = this.$refs.menuHead;
      if ($menuHead) {
        // todo $menuHead.handleGetMenuHeight();
      }
    },
    handleReload() {
      // 针对缓存的页面也生效
      const isCurrentPageCache = this.keepAlive.indexOf(this.$route.name) > -1;
      const pageName = this.$route.name;
      if (isCurrentPageCache) {
        this.keepAliveRemove(pageName);
      }
      this.loadRouter = false;
      this.$nextTick(() => {
        this.loadRouter = true;
        if (isCurrentPageCache) {
          this.keepAlivePush(pageName);
        }
      });
    },
    /** 网站信息（名称、图标等） */
    makeSiteInfo() {
      let siteInfo = CmpSystem.siteInfo;
      const imagePath = webApplication.configHelper.getConfigVal(
        "service.images.viewUrl"
      );

      const logo = siteInfo.sip_site_logo;
      if (logo)
        this.logo.dark = this.logo.normal = imagePath + siteInfo.sip_site_logo;

      const siteTitle = siteInfo.sip_site_title;
      if (siteTitle) webApplication.configHelper.set("titleSuffix", siteTitle);

      let faviconIco = siteInfo.sip_site_faviconIco;
      if (faviconIco) faviconIco = imagePath + faviconIco;
      else faviconIco = "./favicon.ico";
      this.logo.small = faviconIco;
      let el = document.getElementById("cmp_index_favicon");
      if (el) {
        el.href = faviconIco;
      }
    },
    onMenuClick({ menu }) {
      if (menu) this.handleClick(menu.path);
    }
  },
  mounted() {
    document.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener("resize", this.handleResize, { passive: true });
    this.checkFrame();
  },
  beforeDestroy() {
    document.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.handleResize);
  },
  beforeRouteEnter(to, from, next) {
    if (_isInitRouter) {
      next();
    } else {
      //第一次进入
      _isInitRouter = true;
      let curPath = _.trim(to.fullPath || "");
      if (!curPath || curPath == "/") {
        //如果无路由地址，跳转到首页面
        let menu = CmpSystem.getMenuHome();
        if (menu) CmpSystem.openByMenu(menu, { main: true });
      } else {
        //如果有路由地址，重新使用open打开，有cmp参数要转换到bingo参数
        const resolve = webApplication.router.resolve(curPath);
        const loc = resolve.location;
        const query = loc.query || {};
        CmpSystem.open(loc, null, { main: true, type: query.cmpuimode });
      }
      next(false);
    }
  },
  created() {
    this.makeSiteInfo();
    if (this.isTablet && this.showSiderCollapse) this.updateMenuCollapse(true);
  }
};
</script>
