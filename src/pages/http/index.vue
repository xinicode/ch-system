<template>
  <div class="http-test">
    <input v-model="url" style="width:80%" /> <br />
    <button @click="sendRequest">发送请求($http)</button>
    <button @click="sendRequest2">发送请求(HttpRquest)</button>
    <button @click="sendRequest3">发送请求($http-cached)</button>
    <button @click="sendRequest4">发送请求(Resource)</button>
    <button @click="sendRequest5">发送请求(拦截)</button>
    <button @click="sendRequest6">发送请求(取消)</button>
    <div v-html="JSON.stringify(result)"></div>
    <div v-html="logInfo"></div>
  </div>
</template>

<script>
import { HttpRequest, Resource, HttpInterceptorType, DefaultInterceptorType } from '@fly-vue/core';
import Axios from 'axios';
export default {
  data() {
    return {
      url: 'https://dfuse.bingosoft.net/workflow/api/_ops.json',
      result: {},
      num: 0,
      cachedHttp: null,
      logInfo: ''
    };
  },
  mounted() {
    this.cachedHttp = this.$http;
  },
  methods: {
    async sendRequest() {
      let http = this.$http;
      let key = 'key_' + this.num;
      this.num++;
      http.params({ [key]: this.num });
      try {
        let resp = await http.get(this.url);
        this.result = resp.data;
      } catch (error) {
        console.log(error);
      }
    },
    async sendRequest3() {
      let http = this.cachedHttp;
      let key = 'key_' + this.num;
      this.num++;
      http.params({ [key]: this.num });
      let resp = await http.get(this.url);
      this.result = resp.data;
    },
    async sendRequest2() {
      let http = new HttpRequest();
      let resp = await http.get(this.url);
      this.result = resp.data;
    },
    async sendRequest4() {
      let customActions = {
        test: { method: 'GET' }
      };
      let dlist = {
        r1: {},
        r2: {}
      };
      let resource = Resource('client/{id}', customActions, { root: 'workflow/api' });
      let resp = await resource.test({ id: 'iam', k1: 'k1' });
      dlist.r1 = resp.data;
      resp = await resource.get({ id: 'iam', k2: 'k2' });
      dlist.r2 = resp.data;
      this.result = dlist;
    },
    async sendRequest5() {
      let http = new HttpRequest();
      this.logInfo = '';
      let uid = http.addInterceptor(HttpInterceptorType.request, () => {
        this.logInfo += 'call HttpInterceptorType.request, ';
      });
      http.addInterceptor(HttpInterceptorType.requestError, () => {
        this.logInfo += 'call HttpInterceptorType.requestError, ';
      });
      http.addInterceptor(HttpInterceptorType.response, () => {
        this.logInfo += 'call HttpInterceptorType.response, ';
      });
      http.addInterceptor(HttpInterceptorType.responseError, () => {
        this.logInfo += 'call HttpInterceptorType.responseError, ';
      });
      http.disableInterceptor(DefaultInterceptorType.DefaultRequest);
      try {
        let resp = await http.get(this.url);
        this.result = resp && resp.data;
      } catch (ex) {
        this.logInfo += ex.message;
        throw ex;
      }
    },
    async sendRequest6() {
      let source = Axios.CancelToken.source();
      let http = new HttpRequest();
      http.get(this.url, {
        cancelToken: source.token
      });
      source.cancel('取消请求');
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
