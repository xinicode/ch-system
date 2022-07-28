import webApplication, { WebApplicationEventType, HttpRequest } from '@fly-vue/core';

webApplication.addModule({
  name: 'module_on_sign',
  install: (webApp) => {
    webApp
      .registerEvent(WebApplicationEventType.userSignIn, (session) => {
        console.log(session);
      })
      .registerEvent(WebApplicationEventType.userSignIn, async (session) => {
        let request = new HttpRequest();
        let resp = await request.get('http://localhost:8080/wf-runtime/v2/api-docs');
        console.log(resp.data);
      });
  },
  dependencies: ['module1']
});
