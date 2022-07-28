<template>
    <div class="i18n-test">
        {{ $t('ip') }} <br />
        {{ adash }}
    </div>
</template>

<script>
export default {
    data() {
        return {
            adash: this.$t('alpha_dash')
        };
    },
    mounted() {
        this.cachedHttp = this.$http;
    }
};
</script>
<style lang="less">
.i18n-test {
    button {
        display: inline-block;
        margin: 10px;
    }
}
</style>
