<template>
    <div class="i-layout-menu-head" :class="{ 'i-layout-menu-head-mobile': isMobile }" ref="menuwrap">
        <div v-if="!isMobile" style="overflow:hidden;">
            <Menu mode="horizontal" :active-name="headerName" ref="menu">
                <MenuItem 
                    v-for="(item,index) in filterHeader" 
                    :to="item.path" 
                    :replace="item.replace" 
                    :name="item.name" 
                    :key="item.path" 
                    @click.native="handleClick(item.path, 'header')"
                    :ref="'menuitem' + index "
                    :style="{'visibility':index < activeIndex+1 ? '' : 'hidden'}"
                    >
                    <i-menu-head-title :item="item" />
                </MenuItem>
                <Dropdown :style="{ 'left': activeMenuIndexWidth + 'px' }" v-show="isMenuLimit && !isMobile" trigger="click" transfer class="i-layout-menu-head-more">
                    <Icon size="20" type="ios-more" />
                    <DropdownMenu slot="list">
                        <i-link v-for="(item,index) in filterHeader" :to="item.path" :replace="item.replace" :key="item.path" @click.native="handleClick(item.path, 'header')">
                            <DropdownItem v-if="index >= activeIndex +1">
                                <i-menu-head-title :item="item" />
                            </DropdownItem>
                        </i-link>
                    </DropdownMenu>
                </Dropdown>

            </Menu>
        </div>

        <div v-if="isMobile" class="i-layout-header-trigger i-layout-header-trigger-min i-layout-header-trigger-in i-layout-header-trigger-no-height">
            <Dropdown trigger="click" transfer :class="{ 'i-layout-menu-head-mobile-drop': isMobile }">
                <Icon type="ios-more" />
                <DropdownMenu slot="list">
                    <i-link v-for="item in filterHeader" :to="item.path" :replace="item.replace" :key="item.path" @click.native="handleClick(item.path, 'header')">
                        <DropdownItem>
                            <i-menu-head-title :item="item" />
                        </DropdownItem>
                    </i-link>
                </DropdownMenu>
            </Dropdown>
        </div>
    </div>
</template>
<script>
    import iMenuHeadTitle from './title';
    import { mapState, mapGetters } from 'vuex';
    import { getStyle } from 'view-design/src/utils/assist';
    import clickItem from '@/mixins/click-item';
    import { on, off } from 'view-design/src/utils/dom';
    import { throttle } from 'lodash';
    

    export default {
        name: 'iHeaderMenu',
        mixins: [ clickItem ],
        components: { iMenuHeadTitle },
        computed: {
            ...mapState('admin/layout', [
                'isMobile'
            ]),
            ...mapState('admin/menu', [
                'headerName'
            ]),
            ...mapGetters('admin/menu', [
                'filterHeader'
            ])
        },
        data () {
            return {
                activeIndex:999,
                handleResize: () => {},
                isMenuLimit: false,
                activeMenuIndexWidth:0,
                menuMaxWidth: 0 // 达到这个值后，menu 就显示不下了
            }
        },
        methods: {
            getStyleWidth(){
                const menuMaxWidth = parseInt(getStyle(this.$refs.menuwrap, 'width'));
                for(let i=0;i<this.filterHeader.length;i++){
                    const width = this.$refs['menuitem'+i][0].$el.offsetLeft + this.$refs['menuitem'+i][0].$el.offsetWidth + 44;
                    
                    if(width > menuMaxWidth ){
                        this.activeIndex = i -1;
                        this.activeMenuIndexWidth = this.$refs['menuitem'+i][0].$el.offsetLeft;
                        // console.log(this.activeMenuIndexWidth);
                        break;
                    }
                }
            },
            handleGetMenuHeight () {
                const menuMaxWidth = parseInt(getStyle(this.$refs.menuwrap, 'width'));
                const $menu = this.$refs.menu;
                this.menuMaxWidth = menuMaxWidth;
                if ($menu) {
                    const menuWidth = parseInt(this.$refs.menu.$el.offsetWidth);

                    if (menuWidth > menuMaxWidth) {
                        this.isMenuLimit = true;
                        this.getStyleWidth();
                    }else{
                        this.isMenuLimit = false;
                        this.activeIndex = 99999;
                    }
                } else if (menuWidth >= this.menuMaxWidth) {
                    this.isMenuLimit = true;
                    this.getStyleWidth();
                }
            }
        },
        watch: {
            filterHeader () {
                this.handleGetMenuHeight();
            },
            isMobile () {
                this.handleGetMenuHeight();
            }
        },
        mounted () {
            // debugger;
            this.handleResize = throttle(this.handleGetMenuHeight, 100, { leading: false });
            on(window, 'resize', this.handleResize);
            this.handleGetMenuHeight();

        },
        beforeDestroy () {
            off(window, 'resize', this.handleResize);
        }
    }
</script>
