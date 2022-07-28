<template>
    <div id="app">
        <div class="head">
            <router-link :to="'/'">首页</router-link>
            <router-link :to="'/http'">http测试</router-link>
            <router-link :to="'/proxy'">http代理</router-link>
            <router-link :to="'/i18n'">国际化</router-link>
            <router-link :to="'/permission'">权限</router-link>
        </div>
        <router-view />
    </div>
</template>
<style lang="less">
.head {
    margin: 10px;
    a {
        display: inline-block;
        margin: 5px 10px;
    }
}
</style>
