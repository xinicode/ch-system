<template>
    <div class="http-test">
        <input v-model="url" style="width:80%" /> <br />
        <button @click="sendRequest">发送请求($http)</button>
        <div v-html="JSON.stringify(result)"></div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            url:"./wf-runtime/v2/api-docs",
            result: {},
            num: 0
        };
    },
     mounted() {
         this.cachedHttp = this.$http;
    },
    methods:{
        async sendRequest(){
            let http = this.$http;
            let key = "key_" + this.num;
            this.num++;
            http.params({ [key]:this.num });
            let resp = await http.get(this.url);
            this.result = resp.data;
        }
      
    }
};
</script>
<style lang="less">
.http-test {
    button {
        display: inline-block;
        margin: 10px;
    }
}
</style>
