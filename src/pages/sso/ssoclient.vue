<template>
  <div>
    登录中...
  </div>
</template>
<script>
import { SSOClient, Session } from '@fly-vue/core';
import { startsWith } from 'lodash';
export default {
  mounted() {
    var _self = this;
    if (_self.$route.query['logout'] === '1') {
      Session.doLogout(window.location.protocol + window.location.host + window.location.pathname);
      return;
    }
    SSOClient.onSSOCallback(async (tokenInfo) => {
      await Session.doSignIn(tokenInfo);
      var returnTo = _self.$route.query['returnUrl'];
      if (startsWith(returnTo, 'http')) {
        window.location = returnTo;
      } else {
        _self.$router.push({ path: returnTo });
      }
    });
  }
};
</script>
