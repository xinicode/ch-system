<template>
    <div class="i-layout-menu-head-title">
        <span class="i-layout-menu-head-title-icon" v-if="(item.icon || item.custom || item.img) && !hideIcon">
            <Icon :type="item.icon" v-if="item.icon" />
            <Icon :custom="item.custom" v-else-if="item.custom" />
            <img :src="item.img" v-else-if="item.img" />
        </span>
        <span class="i-layout-menu-head-title-text">{{ item.title }}</span>
    </div>
</template>
<script>
    export default {
        name: 'iMenuHeadTitle',
        props: {
            item: {
                type: Object,
                default () {
                    return {}
                }
            },
            hideIcon: {
                type: Boolean,
                default: false
            }
        }
    }
</script>
