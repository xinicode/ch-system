<template>
  <span>
    <template v-for="menu in topRightMenus">
      <Tooltip v-if="!menu.children || menu.children.length <= 0" :content="menu.title" transfer>
        <span class="i-layout-header-trigger i-layout-header-trigger-min" @click="handleOpen(menu)">
          <!-- <Badge
            :count="lengthError === 0 ? null : lengthError"
            :overflow-count="99"
            :dot="showDot"
            :offset="showDot ? [26, 2] : [20, 0]"
          >
            <Icon :type="menu.icon" v-if="menu.icon" />
            <Icon :custom="menu.custom" v-else />
          </Badge>-->
          <template v-if="menu.code == 'cmp-home-workflow' && workflowCount > '0'">
            <Badge :offset="[-5,0]" type="warning" :text="workflowCount">
              <Icon :type="menu.icon" v-if="menu.icon" />
              <Icon :custom="menu.custom" v-else />
            </Badge>
          </template>
          <template v-else>
            <Icon :type="menu.icon" v-if="menu.icon" />
            <Icon :custom="menu.custom" v-else />
          </template>
        </span>
      </Tooltip>
      <span v-else class="i-layout-header-trigger i-layout-header-trigger-min">
        <Dropdown
          :trigger="isMobile ? 'click' : 'hover'"
          class="i-layout-header-user"
          :class="{ 'i-layout-header-user-mobile': isMobile }"
        >
          <!-- <Avatar size="small" :src="info.avatar || userimg" /> -->
          <template v-if="menu.code == 'cmp-home-workflow' && workflowCount > '0'">
            <Badge :offset="[-5,0]" type="warning" :text="workflowCount" style="line-height:24px;">
              <Icon :type="menu.icon" v-if="menu.icon" />
              <Icon :custom="menu.custom" v-else />
            </Badge>
          </template>
          <template v-else>
            <Icon :type="menu.icon" v-if="menu.icon" />
            <Icon :custom="menu.custom" v-else />
          </template>
          <span
            class="i-layout-header-user-name"
            v-if="menu.code == 'cmp_top_right_user'"
          >{{ info.name }}</span>
          <DropdownMenu slot="list">
            <i-link
              v-for="(childMenu,childMenuIndex) in menu.children"
              :key="childMenu.path"
              :to="childMenu.path"
              :replace="childMenu.replace"
              :name="childMenu.name"
            >
              <DropdownItem>
                <Icon :type="childMenu.icon" v-if="childMenu.icon" />
                <span>{{ childMenu.title }}</span>
              </DropdownItem>
            </i-link>
          </DropdownMenu>
        </Dropdown>
      </span>
    </template>
  </span>
</template>
<script>
import { mapGetters, mapState } from "vuex";
import { CmpSystem } from "@ch/system";
import { MenuService } from "@fly-vue/iview-admin";
// import { CmpLogger } from '@cmp/core';
let _hasWorkflowCount = false;

export default {
  name: "iHeaderMenuRight",
  data() {
    return {
      workflowCount: "",
      topRightMenus: []
    };
  },
  computed: {
    ...mapGetters("admin/log", ["length", "lengthError"]),
    ...mapState("admin/user", ["info"]),
    ...mapState("admin/layout", ["isMobile", "logoutConfirm"]),
    showDot() {
      return !!this.length && this.lengthError === 0;
    },
    tooltipContent() {
      if (!this.length) {
        return "没有日志或异常";
      } else {
        let text = `${this.length} 条日志`;
        if (this.lengthError) text += ` | 包含 ${this.lengthError} 个异常`;
        return text;
      }
    }
  },
  created() {
    this.initTopRightMenu();
    this.initWorkflowCount();
  },
  methods: {
    initTopRightMenu() {
      let topRightmenus = CmpSystem.getBingoTopRightMenus();
      // CmpLogger.debug("topRightmenus", topRightmenus);
      this.topRightMenus = _.map(topRightmenus, item =>
        MenuService.prepareMenu(item)
      );
    },
    handleOpen(menu) {
      CmpSystem.openByMenuId(menu.cmpid, { main: true });
      // this.$router.push(menu.path);
    },
    makeWorkflowCount() {
      // if (!_hasWorkflowCount) return;

    },
    initWorkflowCount() {
      let menu = CmpSystem.getMenu(
        { code: "cmp-home-workflow" },
        this.topRightMenus
      );
      _hasWorkflowCount = !!menu;
      this.makeWorkflowCount();
    }
  }
};
</script>
